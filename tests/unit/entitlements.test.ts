import { describe, expect, it } from "vitest";
import { applyEntitlementOverrides, getPlanEntitlements } from "../../packages/access-control/src";

describe("entitlements", () => {
  it("returns free plan quotas", () => {
    expect(getPlanEntitlements("free").active_agent_quota).toBe(1);
  });

  it("applies overrides", () => {
    const next = applyEntitlementOverrides(getPlanEntitlements("free"), [{ account_id: "acct_1", override_id: "ovr_1", patch: { replay_quota_per_day: 3 }, reason_code: "support_grant" }]);
    expect(next.replay_quota_per_day).toBe(3);
  });
});
