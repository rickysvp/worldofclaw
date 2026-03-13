import type { ReleaseChecklist } from "../release.types";

export const buildStagingChecklist = (input: { regression_ok: boolean; load_ok: boolean; recovery_ok: boolean; permissions_ok: boolean }): ReleaseChecklist => ({
  environment: "staging",
  items: [
    { check_id: "staging_regression", chain: "skill_bridge", status: input.regression_ok ? "pass" : "fail", message: "staging regression suite" },
    { check_id: "staging_load", chain: "audit", status: input.load_ok ? "pass" : "fail", message: "load thresholds satisfied" },
    { check_id: "staging_recovery", chain: "audit", status: input.recovery_ok ? "pass" : "fail", message: "recovery drills verified" },
    { check_id: "staging_permissions", chain: "admin", status: input.permissions_ok ? "pass" : "fail", message: "plan / quota / throttle / suspend gating" }
  ]
});
