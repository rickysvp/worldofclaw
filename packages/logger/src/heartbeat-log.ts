import type { BridgeSessionRecord } from "../../skill-bridge/src/auth/session.types";
import type { WorldLogEntry } from "./log.types";

export const createHeartbeatLog = (world_id: string, session: BridgeSessionRecord): WorldLogEntry => ({
  log_id: `log_heartbeat_${session.session_id}_${session.tick_seen}`,
  world_id,
  tick: session.tick_seen,
  timestamp: new Date((session.last_heartbeat_at_seconds ?? 0) * 1000).toISOString(),
  log_type: "heartbeat_log",
  entity_refs: {
    agent_ids: [session.agent_id],
    session_ids: [session.session_id]
  },
  severity: session.status === "stale" || session.status === "expired" ? "warn" : "info",
  payload: {
    session_status: session.status,
    capability_count: Object.values(session.capabilities).filter(Boolean).length,
    alert_count: session.alerts.length,
    local_digest: session.local_digest
  },
  correlation_id: session.session_id
});
