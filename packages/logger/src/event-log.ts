import type { WorldEvent } from "../../schemas/src";
import type { WorldLogEntry } from "./log.types";

export const createEventLog = (world_id: string, event: WorldEvent): WorldLogEntry => ({
  log_id: `log_event_${event.id}`,
  world_id,
  tick: event.tick,
  timestamp: new Date(event.tick * 600_000).toISOString(),
  log_type: "event_log",
  entity_refs: {
    agent_ids: [event.source_entity_id, event.target_entity_id].filter((value): value is string => value !== null),
    sector_ids: event.sector_id ? [event.sector_id] : [],
    event_ids: [event.id]
  },
  severity: event.level === "critical" ? "critical" : event.level === "error" ? "error" : event.level === "warn" ? "warn" : "info",
  payload: {
    title: event.title,
    kind: event.kind,
    action: event.action,
    message: event.message,
    error_code: event.error_code,
    payload_source: typeof event.payload.source === "string" ? event.payload.source : null
  },
  correlation_id: typeof event.payload.correlation_id === "string" ? event.payload.correlation_id : event.id
});
