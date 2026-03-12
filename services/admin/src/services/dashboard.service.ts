import {
  createActionLog,
  createEconomyLog,
  createEventLog,
  createHeartbeatLog,
  createTickLog,
  queryLogsByAgent,
  queryLogsByFacility,
  queryLogsByOrganization,
  queryLogsBySector,
  queryLogsBySession,
  type WorldLogEntry
} from "../../../../packages/logger/src";
import {
  buildEconomyHealthReport,
  buildOnboardingHealthReport,
  buildOrganizationHealthReport,
  buildWorldHealthReport,
  type AuditAlert
} from "../../../../packages/audit/src";
import type { OrganizationState } from "../../../../packages/social/src/organization.types";
import type { TickEngineResult } from "../../../../packages/simulation/src/tick-context";
import type { MarketTrade, WorldState } from "../../../../packages/schemas/src";
import { getSessionsForAdmin, getWorldState } from "../../../api/src/services/session.service";

export type AdminOverview = {
  world_id: string;
  current_tick: number;
  agent_count: number;
  sector_count: number;
  facility_count: number;
  organization_count: number;
  session_count: number;
  stale_session_count: number;
  ledger_entry_count: number;
  alert_count: number;
};

type AdminStore = {
  organizations: OrganizationState[];
  logs: WorldLogEntry[];
  tick_results: TickEngineResult[];
};

const store: AdminStore = {
  organizations: [],
  logs: [],
  tick_results: []
};

export const resetAdminStore = (): void => {
  store.organizations = [];
  store.logs = [];
  store.tick_results = [];
};

export const setOrganizationsForAdmin = (organizations: ReadonlyArray<OrganizationState>): void => {
  store.organizations = [...organizations];
};

export const appendTickResultForAdmin = (tick_result: TickEngineResult): void => {
  store.tick_results = [...store.tick_results, tick_result];
  store.logs = [...store.logs, createTickLog(tick_result)];
};

export const appendWorldLogForAdmin = (log: WorldLogEntry): void => {
  store.logs = [...store.logs, log];
};

export const hydrateDerivedLogs = (world_state: WorldState = getWorldState()): WorldLogEntry[] => {
  const event_logs = Object.values(world_state.registries.events).map((event) => createEventLog(world_state.meta.id, event));
  const economy_logs = (Object.values(world_state.registries.market_trades) as MarketTrade[]).map((trade) => {
    const ledger_entries = world_state.ledgers.entries.filter((entry) => entry.action_ref === trade.order_id || entry.note.includes(trade.id));
    return createEconomyLog(world_state.meta.id, trade, ledger_entries);
  });
  const heartbeat_logs = getSessionsForAdmin().map((session) => createHeartbeatLog(world_state.meta.id, session));
  return [...store.logs, ...event_logs, ...economy_logs, ...heartbeat_logs];
};

export const getOverview = (): AdminOverview => {
  const world_state = getWorldState();
  const sessions = getSessionsForAdmin();
  const world_health = buildWorldHealthReport({
    world_state,
    sessions,
    organizations: store.organizations,
    logs: hydrateDerivedLogs(world_state),
    ledger_entries: world_state.ledgers.entries
  });

  return {
    world_id: world_state.meta.id,
    current_tick: world_state.meta.current_tick,
    agent_count: Object.keys(world_state.registries.agents).length,
    sector_count: Object.keys(world_state.registries.sectors).length,
    facility_count: Object.keys(world_state.registries.facilities).length,
    organization_count: store.organizations.length,
    session_count: sessions.length,
    stale_session_count: sessions.filter((session) => session.status === "stale").length,
    ledger_entry_count: world_state.ledgers.entries.length,
    alert_count: world_health.alerts.length
  };
};

export const getWorldHealth = () => {
  const world_state = getWorldState();
  return {
    world: buildWorldHealthReport({
      world_state,
      sessions: getSessionsForAdmin(),
      organizations: store.organizations,
      logs: hydrateDerivedLogs(world_state),
      ledger_entries: world_state.ledgers.entries
    }),
    economy: buildEconomyHealthReport(world_state),
    organizations: buildOrganizationHealthReport(store.organizations),
    onboarding: buildOnboardingHealthReport(world_state)
  };
};

export const getAgentView = (agent_id?: string) => {
  const world_state = getWorldState();
  const agents = Object.values(world_state.registries.agents);
  const filtered = agent_id ? agents.filter((agent) => agent.id === agent_id) : agents;
  return filtered.map((agent) => ({
    ...agent,
    logs: queryLogsByAgent(hydrateDerivedLogs(world_state), agent.id)
  }));
};

export const getSectorView = (sector_id?: string) => {
  const world_state = getWorldState();
  const sectors = Object.values(world_state.registries.sectors);
  const filtered = sector_id ? sectors.filter((sector) => sector.id === sector_id) : sectors;
  return filtered.map((sector) => ({
    ...sector,
    logs: queryLogsBySector(hydrateDerivedLogs(world_state), sector.id)
  }));
};

export const getFacilityView = (facility_id?: string) => {
  const world_state = getWorldState();
  const facilities = Object.values(world_state.registries.facilities);
  const filtered = facility_id ? facilities.filter((facility) => facility.id === facility_id) : facilities;
  return filtered.map((facility) => ({
    ...facility,
    logs: queryLogsByFacility(hydrateDerivedLogs(world_state), facility.id)
  }));
};

export const getOrganizationView = (organization_id?: string) => {
  const filtered = organization_id
    ? store.organizations.filter((organization) => organization.organization_id === organization_id)
    : store.organizations;
  const logs = hydrateDerivedLogs();
  return filtered.map((organization) => ({
    ...organization,
    logs: queryLogsByOrganization(logs, organization.organization_id)
  }));
};

export const getSessionView = (session_id?: string) => {
  const sessions = getSessionsForAdmin();
  const filtered = session_id ? sessions.filter((session) => session.session_id === session_id) : sessions;
  const logs = hydrateDerivedLogs();
  return filtered.map((session) => ({
    ...session,
    logs: queryLogsBySession(logs, session.session_id)
  }));
};

export const getLedgerView = (entity_id?: string) => {
  const world_state = getWorldState();
  return entity_id
    ? world_state.ledgers.entries.filter((entry) => entry.entity_id === entity_id || entry.counterparty_entity_id === entity_id)
    : world_state.ledgers.entries;
};

export const getAlertsView = (): AuditAlert[] => getWorldHealth().world.alerts;
