import type { WorldLogEntry } from "../log.types";

export const serializeActionLog = (entry: WorldLogEntry): string => JSON.stringify({
  log_id: entry.log_id,
  correlation_id: entry.correlation_id,
  action_type: entry.payload.action_type ?? null,
  status: entry.payload.status ?? null,
  success: entry.payload.success ?? null,
  error_code: entry.payload.error_code ?? null
});
