import type { BridgeSessionRecord } from "../../skill-bridge/src/auth/session.types";
import type { SessionAuditResult } from "./audit.types";

export const auditSessions = (sessions: ReadonlyArray<BridgeSessionRecord>): SessionAuditResult => {
  const stale_sessions = sessions.filter((session) => session.status === "stale");
  return {
    ok: stale_sessions.length === 0,
    stale_sessions,
    issues: stale_sessions.map((session) => `session ${session.session_id} is stale`)
  };
};
