import type { BridgeSessionRecord } from "../../skill-bridge/src/auth/session.types";
import type { WorldLogEntry } from "../../logger/src/log.types";
import type { ProcessedTickReceipt, TickEngineResult } from "../../simulation/src/tick-context";
import type { Facility, LedgerEntry, Sector, WorldState } from "../../schemas/src";
import type { OrganizationState } from "../../social/src/organization.types";

export type AlertCode =
  | "NEGATIVE_RESOURCE"
  | "DOUBLE_SETTLEMENT"
  | "STALE_SESSION"
  | "PRICE_SHOCK"
  | "CONTROL_DRIFT"
  | "TICK_STALL"
  | "QUEUE_BACKLOG"
  | "NEWBIE_FAILURE_SPIKE";

export type AlertSeverity = "info" | "warn" | "error" | "critical";

export type AuditAlert = {
  alert_id: string;
  code: AlertCode;
  severity: AlertSeverity;
  tick: number;
  message: string;
  entity_refs: {
    agent_ids?: string[];
    sector_ids?: string[];
    facility_ids?: string[];
    organization_ids?: string[];
    session_ids?: string[];
  };
  correlation_id: string;
};

export type ReplayResult = {
  tick_number: number;
  expected_checksum: string;
  replay_checksum: string;
  matches: boolean;
  state_diff: TickEngineResult["state_diff"];
};

export type LedgerReconcileResult = {
  balanced: boolean;
  treasury_total: number;
  issues: string[];
};

export type BalanceAuditResult = {
  ok: boolean;
  issues: string[];
};

export type ResourceAuditResult = {
  ok: boolean;
  issues: string[];
};

export type ControlAuditResult = {
  ok: boolean;
  issues: string[];
  sectors: Sector[];
  facilities: Facility[];
};

export type SessionAuditResult = {
  ok: boolean;
  stale_sessions: BridgeSessionRecord[];
  issues: string[];
};

export type WorldHealthReport = {
  world_id: string;
  tick: number;
  receipts: number;
  alerts: AuditAlert[];
  log_count: number;
};

export type EconomyHealthReport = {
  total_credits: number;
  treasury_total: number;
  market_trade_count: number;
  issues: string[];
};

export type OrganizationHealthReport = {
  organization_count: number;
  unstable_organization_ids: string[];
};

export type OnboardingHealthReport = {
  protected_agents: number;
  failing_newbies: number;
};

export type ReplayInput = {
  world_state: WorldState;
  receipt: ProcessedTickReceipt;
};

export type WorldHealthContext = {
  world_state: WorldState;
  sessions: BridgeSessionRecord[];
  organizations: OrganizationState[];
  logs: WorldLogEntry[];
  ledger_entries: LedgerEntry[];
};
