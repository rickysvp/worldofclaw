import { beforeEach, describe, expect, it } from "vitest";
import { handleEntitlementsRoute } from "../../services/platform/src/routes/entitlements";
import { handleSubscriptionsRoute } from "../../services/platform/src/routes/subscriptions";
import { resetBillingAdminService } from "../../services/platform/src/services/billing-admin.service";
import { resetMeteringService } from "../../services/platform/src/services/metering.service";

const owner_headers = { "x-platform-role": "owner", "x-platform-subject": "owner_1", "x-platform-account": "acct_upgrade" };

describe("free to pro upgrade flow", () => {
  beforeEach(() => {
    resetBillingAdminService();
    resetMeteringService();
  });

  it("upgrades entitlements from free to pro", () => {
    const before = handleEntitlementsRoute({ headers: owner_headers, query: { account_id: "acct_upgrade" } });
    expect(before.status).toBe(200);
    if (!before.body.ok || !before.body.data) throw new Error("missing before entitlements");
    expect(before.body.data.active_agent_quota).toBe(1);

    const upgraded = handleSubscriptionsRoute({ headers: owner_headers, body: { account_id: "acct_upgrade", plan_id: "pro", tick: 10 } });
    expect(upgraded.status).toBe(200);

    const after = handleEntitlementsRoute({ headers: owner_headers, query: { account_id: "acct_upgrade" } });
    if (!after.body.ok || !after.body.data) throw new Error("missing after entitlements");
    expect(after.body.data.active_agent_quota).toBeGreaterThan(1);
  });
});
