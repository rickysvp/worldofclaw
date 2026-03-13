import type { RecoveryResult } from "../recovery.types";

export const recoverQueueBacklog = (backlog_after_drain: number): RecoveryResult => ({
  incident_type: "queue_backlog",
  status: backlog_after_drain === 0 ? "verified" : "failed",
  message: backlog_after_drain === 0 ? "queue backlog drained" : "queue backlog remains after drain",
  verification_passed: backlog_after_drain === 0
});
