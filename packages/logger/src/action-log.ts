import type { ResolvedActionRecord } from "../../schemas/src";
import type { WorldLogEntry } from "./log.types";

export const createActionLog = (world_id: string, action: ResolvedActionRecord): WorldLogEntry => ({
  log_id: `log_action_${action.action_id}`,
  world_id,
  tick: action.started_at_tick,
  timestamp: new Date(action.started_at_tick * 600_000).toISOString(),
  log_type: "action_log",
  entity_refs: {
    agent_ids: [action.agent_id],
    event_ids: action.event_ids,
    ledger_entry_ids: action.ledger_ids
  },
  severity: action.success ? "info" : "warn",
  payload: {
    action_type: action.action_type,
    success: action.success,
    status: action.status,
    error_code: action.error_code,
    summary: action.summary,
    started_at_tick: action.started_at_tick,
    finished_at_tick: action.finished_at_tick
  },
  correlation_id: action.action_id
});
