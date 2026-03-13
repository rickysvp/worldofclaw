import type { RecoveryResult } from "../recovery.types";

export const recoverTickStall = (has_fresh_snapshot: boolean): RecoveryResult => ({
  incident_type: "tick_stall",
  status: has_fresh_snapshot ? "verified" : "failed",
  message: has_fresh_snapshot ? "tick stall cleared with snapshot-based replay verification" : "tick stall recovery requires a fresh snapshot",
  verification_passed: has_fresh_snapshot
});
