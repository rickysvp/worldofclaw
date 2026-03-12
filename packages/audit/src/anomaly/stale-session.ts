import type { BridgeSessionRecord } from "../../../skill-bridge/src/auth/session.types";
import type { AuditAlert } from "../audit.types";

export const detectStaleSessionAlerts = (sessions: ReadonlyArray<BridgeSessionRecord>, tick: number): AuditAlert[] =>
  sessions
    .filter((session) => session.status === "stale")
    .map((session) => ({
      alert_id: `alert_stale_${session.session_id}`,
      code: "STALE_SESSION",
      severity: "warn",
      tick,
      message: `session ${session.session_id} is stale`,
      entity_refs: { session_ids: [session.session_id], agent_ids: [session.agent_id] },
      correlation_id: session.session_id
    }));
