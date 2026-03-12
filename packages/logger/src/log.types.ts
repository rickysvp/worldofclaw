import type { TickEngineIssue, TickEngineResult } from "../../simulation/src/tick-context";

export type LogType =
  | "tick_log"
  | "action_log"
  | "event_log"
  | "economy_log"
  | "relation_log"
  | "org_log"
  | "heartbeat_log";

export type LogSeverity = "debug" | "info" | "warn" | "error" | "critical";

export type EntityRefs = {
  agent_ids?: string[];
  sector_ids?: string[];
  facility_ids?: string[];
  organization_ids?: string[];
  session_ids?: string[];
  ledger_entry_ids?: string[];
  event_ids?: string[];
};

export type LogPayload = Record<string, string | number | boolean | null | string[] | number[] | boolean[]>;

export type WorldLogEntry = {
  log_id: string;
  world_id: string;
  tick: number;
  timestamp: string;
  log_type: LogType;
  entity_refs: EntityRefs;
  severity: LogSeverity;
  payload: LogPayload;
  correlation_id: string;
};

export type TickDiffLogPayload = {
  world_id: string;
  tick: number;
  phase_trace: TickEngineResult["phase_trace"];
  issue_codes: string[];
  event_count: number;
  ledger_count: number;
};

export type IssueLike = Pick<TickEngineIssue, "code" | "message">;
