import type { ReleaseChecklist } from "../release.types";

export const buildPostdeployChecklist = (input: { smoke_ok: boolean; alerts_ok: boolean; billing_ok: boolean; sessions_ok: boolean }): ReleaseChecklist => ({
  environment: "production",
  items: [
    { check_id: "post_smoke", chain: "skill_bridge", status: input.smoke_ok ? "pass" : "fail", message: "production smoke flow" },
    { check_id: "post_alerts", chain: "audit", status: input.alerts_ok ? "pass" : "fail", message: "alerts and replay available" },
    { check_id: "post_billing", chain: "billing", status: input.billing_ok ? "pass" : "fail", message: "billing and revenue healthy" },
    { check_id: "post_sessions", chain: "admin", status: input.sessions_ok ? "pass" : "fail", message: "session liveness stable" }
  ]
});
