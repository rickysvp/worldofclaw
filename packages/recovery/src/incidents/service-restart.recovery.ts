import type { RecoveryResult } from "../recovery.types";

export const recoverServiceRestart = (all_services_healthy: boolean): RecoveryResult => ({
  incident_type: "service_restart",
  status: all_services_healthy ? "verified" : "failed",
  message: all_services_healthy ? "service restart verified" : "service restart incomplete",
  verification_passed: all_services_healthy
});
