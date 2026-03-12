import { getWorldState, getSessionsForAdmin } from "../../../api/src/services/session.service";
import { meterActiveAgents, meterApiUsage, meterLogRetention, meterOrgFeatureUsage, meterReplayUsage, type UsageMeterRecord, type UsageSnapshot } from "../../../../packages/billing/src/index";

type PlatformUsageStore = {
  api_usage: Map<string, UsageSnapshot>;
  meter_history: Map<string, UsageMeterRecord[]>;
};

const createUsageStore = (): PlatformUsageStore => ({ api_usage: new Map(), meter_history: new Map() });
let usage_store = createUsageStore();

const currentUsage = (account_id: string): UsageSnapshot => usage_store.api_usage.get(account_id) ?? {
  account_id,
  active_agents: 0,
  sessions: 0,
  heartbeat_requests: 0,
  state_requests: 0,
  jobs_requests: 0,
  action_requests: 0,
  replay_requests: 0,
  log_retention_days: 7,
  organization_feature_count: 0,
  facility_license_count: 0
};

export const resetMeteringService = (): void => {
  usage_store = createUsageStore();
};

export const seedUsageSnapshot = (snapshot: UsageSnapshot): void => {
  usage_store.api_usage.set(snapshot.account_id, { ...snapshot });
};

export const recordApiUsage = (input: { account_id: string; endpoint: "heartbeat" | "state" | "jobs" | "action"; count?: number }): UsageSnapshot => {
  const next = { ...currentUsage(input.account_id) };
  const count = input.count ?? 1;
  if (input.endpoint === "heartbeat") next.heartbeat_requests += count;
  if (input.endpoint === "state") next.state_requests += count;
  if (input.endpoint === "jobs") next.jobs_requests += count;
  if (input.endpoint === "action") next.action_requests += count;
  usage_store.api_usage.set(input.account_id, next);
  return { ...next };
};

export const recordReplayUsage = (account_id: string, count = 1): UsageSnapshot => {
  const next = { ...currentUsage(account_id), replay_requests: currentUsage(account_id).replay_requests + count };
  usage_store.api_usage.set(account_id, next);
  return { ...next };
};

export const setLogRetentionDays = (account_id: string, days: number): UsageSnapshot => {
  const next = { ...currentUsage(account_id), log_retention_days: days };
  usage_store.api_usage.set(account_id, next);
  return { ...next };
};

export const setOrganizationFeatureCount = (account_id: string, count: number): UsageSnapshot => {
  const next = { ...currentUsage(account_id), organization_feature_count: count };
  usage_store.api_usage.set(account_id, next);
  return { ...next };
};

export const setFacilityLicenseCount = (account_id: string, count: number): UsageSnapshot => {
  const next = { ...currentUsage(account_id), facility_license_count: count };
  usage_store.api_usage.set(account_id, next);
  return { ...next };
};

export const collectUsageSnapshot = (account_id: string): UsageSnapshot => {
  const seeded = currentUsage(account_id);
  const world = getWorldState();
  const active_agents = Object.values(world.registries.agents).filter((agent): boolean => agent.owner_user_id === account_id).length;
  const sessions = getSessionsForAdmin().filter((session): boolean => session.user_id === account_id).length;
  const snapshot: UsageSnapshot = { ...seeded, active_agents, sessions };
  usage_store.api_usage.set(account_id, snapshot);
  return { ...snapshot };
};

export const buildUsageMeters = (account_id: string, tick: number): UsageMeterRecord[] => {
  const snapshot = collectUsageSnapshot(account_id);
  const meters = [
    meterActiveAgents(snapshot, tick),
    meterLogRetention(snapshot, tick),
    meterReplayUsage(snapshot, tick),
    meterApiUsage(snapshot, tick),
    meterOrgFeatureUsage(snapshot, tick)
  ];
  usage_store.meter_history.set(account_id, [...(usage_store.meter_history.get(account_id) ?? []), ...meters]);
  return meters;
};

export const getUsageMeters = (account_id: string): UsageMeterRecord[] => [...(usage_store.meter_history.get(account_id) ?? [])];
