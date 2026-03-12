import { randomBytes, randomUUID } from "node:crypto";
import {
  createDefaultWorldState,
  event_schema,
  pending_action_schema,
  type Agent,
  type PendingAction,
  type WorldState
} from "../../../../packages/schemas/src";
import { canRevealFacilityDetails, getVisibleSectorIds } from "../../../../packages/rules/src";
import type { SkillRegistrationRecord } from "../../../../packages/skill-bridge/src/auth/claim.types";
import type { BridgeSessionRecord } from "../../../../packages/skill-bridge/src/auth/session.types";
import type { ClaimTokenRecord, WorldAccessTokenRecord } from "../../../../packages/skill-bridge/src/auth/token.types";
import {
  bridge_skill_name,
  bridge_session_statuses,
  claim_token_ttl_seconds,
  heartbeat_interval_seconds,
  heartbeat_stale_after_seconds,
  max_jobs_per_pull,
  world_access_token_ttl_seconds
} from "../../../../packages/skill-bridge/src/constants";
import type { BridgeAlert, BridgeCapabilities, BridgeJob, BridgeSessionStatus, SyncFlags, WorldHint } from "../../../../packages/skill-bridge/src/protocol.types";

export type IdempotentRecord = {
  scope: string;
  scope_identity: string;
  key: string;
  response: unknown;
};

export type SessionView = {
  session: BridgeSessionRecord;
  token: WorldAccessTokenRecord;
};

export type WorldStateView = {
  server_tick: number;
  agent: {
    id: string;
    location: string;
    power: number;
    durability: number;
    compute: number;
    credits: number;
    inventory: Agent["inventory"];
  };
  visible_sector_ids: string[];
  visible_facility_ids: string[];
  pending_event_ids: string[];
  sync_flags: SyncFlags;
  world_hints: WorldHint;
};

type BridgeStore = {
  world_state: WorldState;
  registrations: Map<string, SkillRegistrationRecord>;
  claim_tokens: Map<string, ClaimTokenRecord>;
  sessions: Map<string, BridgeSessionRecord>;
  tokens: Map<string, WorldAccessTokenRecord>;
  idempotency: Map<string, IdempotentRecord>;
  rate_limits: Map<string, { count: number; reset_at_seconds: number }>;
  queued_actions: Map<string, PendingAction[]>;
};

const createToken = (prefix: string): string => `${prefix}_${randomBytes(16).toString("hex")}`;

const defaultCapabilities = (): BridgeCapabilities => ({
  register: true,
  claim: true,
  heartbeat: true,
  state: true,
  jobs: true,
  action: true,
  event_ack: true
});

const createStore = (): BridgeStore => ({
  world_state: createDefaultWorldState("skill_bridge_seed"),
  registrations: new Map(),
  claim_tokens: new Map(),
  sessions: new Map(),
  tokens: new Map(),
  idempotency: new Map(),
  rate_limits: new Map(),
  queued_actions: new Map()
});

let store: BridgeStore = createStore();

const getNowSeconds = (): number => Math.floor(Date.now() / 1000);

const getSessionStatus = (session: BridgeSessionRecord, token: WorldAccessTokenRecord, now_seconds: number): BridgeSessionStatus => {
  if (token.revoked_at_seconds !== null) {
    return "revoked";
  }
  if (now_seconds >= token.expires_at_seconds || now_seconds >= session.expires_at_seconds) {
    return "expired";
  }
  if (session.status === "replaced") {
    return "replaced";
  }
  if (session.last_heartbeat_at_seconds !== null && now_seconds - session.last_heartbeat_at_seconds >= heartbeat_stale_after_seconds) {
    return "stale";
  }
  return "active";
};

const getPendingEventIdsForAgent = (agent_id: string, session: BridgeSessionRecord): string[] =>
  Object.values(store.world_state.registries.events)
    .filter((event) => event.target_entity_id === agent_id && !session.acked_event_ids.includes(event.id))
    .map((event) => event.id)
    .sort();

const createWorldHints = (agent: Agent, session: BridgeSessionRecord): WorldHint => ({
  protected_zone: Boolean(agent.runtime_flags.safe_until_tick && store.world_state.meta.current_tick <= Number(agent.runtime_flags.safe_until_tick)),
  current_sector_id: agent.location,
  visible_sector_count: getVisibleSectorIds(store.world_state, agent.location).length,
  pending_event_count: getPendingEventIdsForAgent(agent.id, session).length
});

const createSyncFlags = (session: BridgeSessionRecord, agent: Agent, now_seconds: number): SyncFlags => {
  const token = store.tokens.get(session.world_access_token_id);
  const session_status = token ? getSessionStatus(session, token, now_seconds) : "expired";
  return {
    state_outdated: session.tick_seen < store.world_state.meta.current_tick,
    jobs_pending: getPendingEventIdsForAgent(agent.id, session).length > 0,
    session_replaced: session_status === "replaced",
    protected_zone: Boolean(agent.runtime_flags.safe_until_tick && store.world_state.meta.current_tick <= Number(agent.runtime_flags.safe_until_tick))
  };
};

const createDecisionJobs = (agent: Agent): BridgeJob[] => {
  const jobs: BridgeJob[] = [];
  if (agent.power <= 3) {
    jobs.push({
      job_id: `decision_power_${agent.id}_${store.world_state.meta.current_tick}`,
      job_type: "decision_card",
      tick: store.world_state.meta.current_tick,
      summary: "Power is low. Prioritize charging.",
      payload: { facility_required: true, action_type: "charge" }
    });
  }
  if (agent.durability <= 8) {
    jobs.push({
      job_id: `decision_repair_${agent.id}_${store.world_state.meta.current_tick}`,
      job_type: "decision_card",
      tick: store.world_state.meta.current_tick,
      summary: "Durability is low. Prioritize repair.",
      payload: { facility_required: true, action_type: "repair" }
    });
  }
  return jobs;
};

export const resetSessionService = (): void => {
  store = createStore();
};

export const getWorldState = (): WorldState => structuredClone(store.world_state);

export const setWorldState = (world_state: WorldState): void => {
  store.world_state = structuredClone(world_state);
};

export const seedBridgeAgentForTests = (input: { user_id: string; agent_id: string; claw_external_id?: string; location?: string }): Agent => {
  const location = input.location ?? "sector_0_0";
  const agent = {
    id: input.agent_id,
    version: 1,
    created_at_tick: store.world_state.meta.current_tick,
    updated_at_tick: store.world_state.meta.current_tick,
    owner_user_id: input.user_id,
    external_agent_id: input.claw_external_id ?? `${input.agent_id}_claw`,
    name: input.agent_id,
    location,
    status: "idle",
    power: 8,
    power_max: 20,
    durability: 20,
    durability_max: 20,
    compute: 2,
    compute_max: 2,
    cargo_used: 0,
    cargo_max: 20,
    credits: 10,
    trust: 0,
    threat: 0,
    bond: 0,
    shelter_level: 1,
    access_level: 1,
    inventory: {
      power: 8,
      scrap: 2,
      composite: 0,
      circuit: 0,
      flux: 0,
      xenite: 0,
      compute_core: 0,
      credits: 10
    },
    skills: [],
    affiliations: [],
    runtime_flags: { onboarding_completed: true, safe_until_tick: store.world_state.meta.current_tick + 6 }
  } satisfies Agent;

  store.world_state.registries.agents[input.agent_id] = agent;
  store.world_state.indexes.agent_ids = [...new Set([...store.world_state.indexes.agent_ids, input.agent_id])];
  store.world_state.indexes.agents_by_owner_user_id[input.user_id] = [
    ...(store.world_state.indexes.agents_by_owner_user_id[input.user_id] ?? []),
    input.agent_id
  ];
  store.world_state.indexes.agents_by_location[location] = [
    ...(store.world_state.indexes.agents_by_location[location] ?? []),
    input.agent_id
  ];
  store.world_state.ledgers.resource_balances_by_entity[input.agent_id] = { ...agent.inventory };
  store.world_state.ledgers.credits_balances_by_entity[input.agent_id] = agent.credits;
  return structuredClone(agent);
};

export const getAgent = (agent_id: string): Agent | null => store.world_state.registries.agents[agent_id] ?? null;

export const getRegistration = (registration_id: string): SkillRegistrationRecord | null => store.registrations.get(registration_id) ?? null;

export const registerSkill = (input: {
  user_id: string;
  agent_id: string;
  skill_name: string;
  skill_version: string;
  local_digest: string;
  requested_capabilities: BridgeCapabilities;
  idempotency_key: string;
  now_seconds?: number;
}) => {
  const now_seconds = input.now_seconds ?? getNowSeconds();
  const registration_id = `registration_${randomUUID()}`;
  const claim_token_id = `claim_token_${randomUUID()}`;
  const claim_token = createToken("claim");
  const record: SkillRegistrationRecord = {
    registration_id,
    skill_name: input.skill_name,
    user_id: input.user_id,
    agent_id: input.agent_id,
    skill_version: input.skill_version,
    local_digest: input.local_digest,
    requested_capabilities: input.requested_capabilities,
    created_at_seconds: now_seconds,
    claim_token_id,
    last_idempotency_key: input.idempotency_key
  };
  const claim: ClaimTokenRecord = {
    token_id: claim_token_id,
    claim_token,
    registration_id,
    agent_id: input.agent_id,
    user_id: input.user_id,
    skill_name: input.skill_name,
    issued_at_seconds: now_seconds,
    expires_at_seconds: now_seconds + claim_token_ttl_seconds,
    used_at_seconds: null
  };
  store.registrations.set(registration_id, record);
  store.claim_tokens.set(claim_token_id, claim);
  return {
    registration_id,
    claim_token,
    claim_expires_at_seconds: claim.expires_at_seconds,
    heartbeat_interval_seconds
  };
};

export const claimSession = (input: {
  claim_token: string;
  agent_id: string;
  skill_name: string;
  local_digest: string;
  now_seconds?: number;
}) => {
  const now_seconds = input.now_seconds ?? getNowSeconds();
  const claim = [...store.claim_tokens.values()].find((entry) => entry.claim_token === input.claim_token) ?? null;
  if (!claim) {
    return { error_code: "BRIDGE_CLAIM_TOKEN_INVALID" as const };
  }
  if (claim.used_at_seconds !== null) {
    return { error_code: "BRIDGE_CLAIM_TOKEN_USED" as const };
  }
  if (claim.expires_at_seconds <= now_seconds) {
    return { error_code: "BRIDGE_TOKEN_EXPIRED" as const };
  }
  if (claim.skill_name !== input.skill_name) {
    return { error_code: "BRIDGE_SKILL_NAME_MISMATCH" as const };
  }
  if (claim.agent_id !== input.agent_id) {
    return { error_code: "BRIDGE_AGENT_MISMATCH" as const };
  }
  if (!getAgent(input.agent_id)) {
    return { error_code: "BRIDGE_AGENT_NOT_FOUND" as const };
  }

  for (const session of store.sessions.values()) {
    if (session.agent_id === input.agent_id && session.status === "active") {
      session.status = "replaced";
      const token = store.tokens.get(session.world_access_token_id);
      if (token) {
        token.revoked_at_seconds = now_seconds;
      }
    }
  }

  claim.used_at_seconds = now_seconds;
  const world_access_token_id = `world_token_${randomUUID()}`;
  const world_access_token = createToken("world");
  const session_id = `session_${randomUUID()}`;
  const registration = store.registrations.get(claim.registration_id)!;
  const token_record: WorldAccessTokenRecord = {
    token_id: world_access_token_id,
    world_access_token,
    session_id,
    agent_id: claim.agent_id,
    user_id: claim.user_id,
    issued_at_seconds: now_seconds,
    expires_at_seconds: now_seconds + world_access_token_ttl_seconds,
    revoked_at_seconds: null
  };
  const session_record: BridgeSessionRecord = {
    session_id,
    registration_id: claim.registration_id,
    skill_name: input.skill_name,
    user_id: claim.user_id,
    agent_id: claim.agent_id,
    status: "active",
    capabilities: registration.requested_capabilities,
    claim_token_id: claim.token_id,
    world_access_token_id,
    created_at_seconds: now_seconds,
    expires_at_seconds: token_record.expires_at_seconds,
    last_heartbeat_at_seconds: null,
    tick_seen: store.world_state.meta.current_tick,
    local_digest: input.local_digest,
    alerts: [],
    acked_event_ids: [],
    queued_action_ids: []
  };
  store.tokens.set(world_access_token_id, token_record);
  store.sessions.set(session_id, session_record);
  return {
    session_id,
    world_access_token,
    access_expires_at_seconds: token_record.expires_at_seconds,
    session_status: session_record.status
  };
};

export const getSessionByAccessToken = (world_access_token: string, now_seconds = getNowSeconds()): SessionView | null => {
  const token = [...store.tokens.values()].find((entry) => entry.world_access_token === world_access_token) ?? null;
  if (!token) {
    return null;
  }
  const session = store.sessions.get(token.session_id);
  if (!session) {
    return null;
  }
  session.status = getSessionStatus(session, token, now_seconds);
  return { session, token };
};

const getIdempotencyCacheKey = (scope: string, scope_identity: string, key: string): string =>
  `${scope}:${scope_identity}:${key}`;

export const recordIdempotentResponse = (scope: string, scope_identity: string, key: string, response: unknown): void => {
  store.idempotency.set(getIdempotencyCacheKey(scope, scope_identity, key), { scope, scope_identity, key, response });
};

export const getIdempotentResponse = <T>(scope: string, scope_identity: string, key: string): T | null =>
  (store.idempotency.get(getIdempotencyCacheKey(scope, scope_identity, key))?.response as T | undefined) ?? null;

export const consumeRateLimit = (scope: string, identity: string, now_seconds = getNowSeconds(), limit = 60, window_seconds = 60): boolean => {
  const key = `${scope}:${identity}`;
  const current = store.rate_limits.get(key);
  if (!current || current.reset_at_seconds <= now_seconds) {
    store.rate_limits.set(key, { count: 1, reset_at_seconds: now_seconds + window_seconds });
    return true;
  }
  if (current.count >= limit) {
    return false;
  }
  current.count += 1;
  return true;
};

export const updateHeartbeat = (input: {
  session_id: string;
  tick_seen: number;
  local_digest: string;
  alerts: BridgeAlert[];
  now_seconds?: number;
}) => {
  const now_seconds = input.now_seconds ?? getNowSeconds();
  const session = store.sessions.get(input.session_id);
  if (!session) {
    return null;
  }
  session.last_heartbeat_at_seconds = now_seconds;
  session.tick_seen = input.tick_seen;
  session.local_digest = input.local_digest;
  session.alerts = input.alerts;
  const token = store.tokens.get(session.world_access_token_id)!;
  session.status = getSessionStatus(session, token, now_seconds);
  const agent = getAgent(session.agent_id)!;
  return {
    server_tick: store.world_state.meta.current_tick,
    session_status: session.status,
    next_heartbeat_after_seconds: heartbeat_interval_seconds,
    sync_flags: createSyncFlags(session, agent, now_seconds),
    world_hints: createWorldHints(agent, session)
  };
};

export const getStateView = (session_id: string, now_seconds = getNowSeconds()): WorldStateView | null => {
  const session = store.sessions.get(session_id);
  if (!session) {
    return null;
  }
  const token = store.tokens.get(session.world_access_token_id)!;
  session.status = getSessionStatus(session, token, now_seconds);
  const agent = getAgent(session.agent_id);
  if (!agent) {
    return null;
  }
  const visible_sector_ids = getVisibleSectorIds(store.world_state, agent.location);
  const visible_facility_ids = Object.values(store.world_state.registries.facilities)
    .filter((facility) => visible_sector_ids.includes(facility.sector_id))
    .filter((facility) => {
      const sector = store.world_state.registries.sectors[facility.sector_id];
      return sector ? canRevealFacilityDetails(sector, agent.owner_user_id) : false;
    })
    .map((facility) => facility.id);

  return {
    server_tick: store.world_state.meta.current_tick,
    agent: {
      id: agent.id,
      location: agent.location,
      power: agent.power,
      durability: agent.durability,
      compute: agent.compute,
      credits: agent.credits,
      inventory: { ...agent.inventory }
    },
    visible_sector_ids,
    visible_facility_ids,
    pending_event_ids: getPendingEventIdsForAgent(agent.id, session),
    sync_flags: createSyncFlags(session, agent, now_seconds),
    world_hints: createWorldHints(agent, session)
  };
};

export const getJobsForSession = (session_id: string): { server_tick: number; jobs: BridgeJob[] } | null => {
  const session = store.sessions.get(session_id);
  if (!session) {
    return null;
  }
  const agent = getAgent(session.agent_id);
  if (!agent) {
    return null;
  }
  const pending_events = getPendingEventIdsForAgent(agent.id, session).map((event_id) => ({
    job_id: `ack_${event_id}`,
    job_type: "event_ack" as const,
    tick: store.world_state.meta.current_tick,
    summary: `Acknowledge world event ${event_id}`,
    payload: { event_id }
  }));

  const job_priority: Record<BridgeJob["job_type"], number> = {
    decision_card: 0,
    action_hint: 1,
    event_ack: 2
  };

  const jobs = [...createDecisionJobs(agent), ...pending_events]
    .sort((left, right) => {
      if (left.tick !== right.tick) {
        return left.tick - right.tick;
      }
      if (job_priority[left.job_type] !== job_priority[right.job_type]) {
        return job_priority[left.job_type] - job_priority[right.job_type];
      }
      return left.job_id.localeCompare(right.job_id);
    })
    .slice(0, max_jobs_per_pull);

  return {
    server_tick: store.world_state.meta.current_tick,
    jobs
  };
};

export const queueSubmittedAction = (input: {
  session_id: string;
  body: { agent_id: string; action_type: string; tick_seen: number; payload: Record<string, string | number | boolean | null> };
}): { action_id: string; accepted: boolean; expected_end_tick: number; error_code: string | null } | null => {
  const session = store.sessions.get(input.session_id);
  if (!session) {
    return null;
  }
  if (session.agent_id !== input.body.agent_id) {
    return { action_id: `rejected_${randomUUID()}`, accepted: false, expected_end_tick: store.world_state.meta.current_tick, error_code: "BRIDGE_AGENT_MISMATCH" };
  }

  const action_id = `bridge_action_${randomUUID()}`;
  const parsed = pending_action_schema.safeParse({
    id: action_id,
    tick_number: store.world_state.meta.current_tick,
    agent_id: input.body.agent_id,
    action_type: input.body.action_type,
    target_sector_id: typeof input.body.payload.target_sector_id === "string" ? input.body.payload.target_sector_id : null,
    target_agent_id: typeof input.body.payload.target_agent_id === "string" ? input.body.payload.target_agent_id : null,
    facility_id: typeof input.body.payload.facility_id === "string" ? input.body.payload.facility_id : null,
    trade_side: typeof input.body.payload.trade_side === "string" ? input.body.payload.trade_side : null,
    trade_resource_type: typeof input.body.payload.trade_resource_type === "string" ? input.body.payload.trade_resource_type : null,
    trade_amount: typeof input.body.payload.trade_amount === "number" ? input.body.payload.trade_amount : 0,
    unit_price: typeof input.body.payload.unit_price === "number" ? input.body.payload.unit_price : 0,
    build_facility_type: typeof input.body.payload.build_facility_type === "string" ? input.body.payload.build_facility_type : null,
    claim_target_kind: typeof input.body.payload.claim_target_kind === "string" ? input.body.payload.claim_target_kind : null,
    claim_target_id: typeof input.body.payload.claim_target_id === "string" ? input.body.payload.claim_target_id : null,
    preferred_resource_type: typeof input.body.payload.preferred_resource_type === "string" ? input.body.payload.preferred_resource_type : null
  });

  if (!parsed.success) {
    return { action_id, accepted: false, expected_end_tick: store.world_state.meta.current_tick, error_code: "BRIDGE_ACTION_REJECTED" };
  }

  store.queued_actions.set(input.body.agent_id, [...(store.queued_actions.get(input.body.agent_id) ?? []), parsed.data]);
  session.queued_action_ids = [...session.queued_action_ids, action_id];
  return { action_id, accepted: true, expected_end_tick: store.world_state.meta.current_tick + 1, error_code: null };
};

export const acknowledgeEvents = (input: { session_id: string; event_ids: string[] }) => {
  const session = store.sessions.get(input.session_id);
  if (!session) {
    return null;
  }
  session.acked_event_ids = [...new Set([...session.acked_event_ids, ...input.event_ids])];
  return {
    acked_event_ids: [...input.event_ids],
    remaining_pending_event_ids: getPendingEventIdsForAgent(session.agent_id, session)
  };
};

export const appendWorldEventForTests = (input: { agent_id: string; tick?: number; title?: string }): string => {
  const tick = input.tick ?? store.world_state.meta.current_tick;
  const id = `event_bridge_${randomUUID()}`;
  const agent = getAgent(input.agent_id);
  store.world_state.registries.events[id] = event_schema.parse({
    id,
    version: 1,
    created_at_tick: tick,
    updated_at_tick: tick,
    tick,
    kind: "agent",
    level: "info",
    action: null,
    source_entity_id: null,
    target_entity_id: input.agent_id,
    sector_id: agent?.location ?? null,
    title: input.title ?? "bridge_event",
    message: "Bridge event generated for testing.",
    error_code: null,
    payload: { source: "test" }
  });
  store.world_state.indexes.event_ids = [...new Set([...store.world_state.indexes.event_ids, id])];
  store.world_state.indexes.events_by_tick[String(tick)] = [...(store.world_state.indexes.events_by_tick[String(tick)] ?? []), id];
  return id;
};
