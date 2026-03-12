import type { TickEngineResult } from "../../simulation/src/tick-context";
import type { WorldLogEntry } from "./log.types";

export const createTickLog = (result: TickEngineResult): WorldLogEntry => ({
  log_id: `log_tick_${result.receipt.receipt_id}`,
  world_id: result.world_id,
  tick: result.tick_number,
  timestamp: new Date(result.tick_number * 600_000).toISOString(),
  log_type: "tick_log",
  entity_refs: {},
  severity: result.issues.length > 0 ? "warn" : "info",
  payload: {
    applied: result.applied,
    event_count: result.event_count,
    ledger_count: result.ledger_count,
    phase_trace: result.phase_trace,
    issue_codes: result.issues.map((issue) => issue.code),
    checksum: result.checksum
  },
  correlation_id: result.receipt.receipt_id
});
