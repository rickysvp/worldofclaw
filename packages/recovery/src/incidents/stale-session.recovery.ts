import type { RecoveryResult } from "../recovery.types";

export const recoverStaleSession = (remaining_stale_sessions: number): RecoveryResult => ({
  incident_type: "stale_session",
  status: remaining_stale_sessions === 0 ? "verified" : "failed",
  message: remaining_stale_sessions === 0 ? "stale sessions cleared" : "stale sessions remain",
  verification_passed: remaining_stale_sessions === 0
});
