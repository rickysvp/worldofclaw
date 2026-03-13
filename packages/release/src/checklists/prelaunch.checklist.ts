import type { ReleaseChecklist } from "../release.types";

export const buildPrelaunchChecklist = (input: {
  skill_bridge_ok: boolean;
  onboarding_ok: boolean;
  billing_ok: boolean;
  audit_ok: boolean;
  admin_ok: boolean;
}): ReleaseChecklist => ({
  environment: "staging",
  items: [
    { check_id: "pre_skill_bridge", chain: "skill_bridge", status: input.skill_bridge_ok ? "pass" : "fail", message: "register -> claim -> heartbeat -> state/jobs -> submit-action" },
    { check_id: "pre_onboarding", chain: "onboarding", status: input.onboarding_ok ? "pass" : "fail", message: "onboarding starter sync" },
    { check_id: "pre_billing", chain: "billing", status: input.billing_ok ? "pass" : "fail", message: "billing and treasury reconcile" },
    { check_id: "pre_audit", chain: "audit", status: input.audit_ok ? "pass" : "fail", message: "audit, replay, alerts healthy" },
    { check_id: "pre_admin", chain: "admin", status: input.admin_ok ? "pass" : "fail", message: "admin overview and alerts available" }
  ]
});
