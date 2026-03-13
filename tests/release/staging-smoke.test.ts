import { describe, expect, it } from "vitest";
import { buildPrelaunchChecklist, buildStagingChecklist, evaluateGoNoGo } from "../../packages/release/src";

describe("staging smoke", () => {
  it("keeps staging go/no-go green when all staging checks pass", () => {
    const prelaunch = buildPrelaunchChecklist({ skill_bridge_ok: true, onboarding_ok: true, billing_ok: true, audit_ok: true, admin_ok: true });
    const staging = buildStagingChecklist({ regression_ok: true, load_ok: true, recovery_ok: true, permissions_ok: true });
    const decision = evaluateGoNoGo([prelaunch, staging]);
    expect(decision.status).toBe("go");
  });
});
