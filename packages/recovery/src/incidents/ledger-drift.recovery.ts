import type { RecoveryResult } from "../recovery.types";

export const recoverLedgerDrift = (drift_remaining: number): RecoveryResult => ({
  incident_type: "ledger_drift",
  status: drift_remaining === 0 ? "verified" : "failed",
  message: drift_remaining === 0 ? "ledger drift reconciled" : "ledger drift still present",
  verification_passed: drift_remaining === 0
});
