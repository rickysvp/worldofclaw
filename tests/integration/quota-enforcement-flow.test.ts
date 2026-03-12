import { beforeEach, describe, expect, it } from "vitest";
import { setWorldState } from "../../services/api/src/services/session.service";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { handleEnforcementRoute } from "../../services/platform/src/routes/enforcement";
import { resetBillingAdminService, upsertSubscription } from "../../services/platform/src/services/billing-admin.service";
import { resetEnforcementService } from "../../services/platform/src/services/enforcement.service";
import { resetMeteringService, recordApiUsage } from "../../services/platform/src/services/metering.service";

const ops_headers = { "x-platform-role": "ops_admin", "x-platform-subject": "ops_1", "x-platform-account": "acct_quota" };

describe("quota enforcement flow", () => {
  beforeEach(() => {
    resetBillingAdminService();
    resetMeteringService();
    resetEnforcementService();
    const world = createDefaultWorldState("quota_seed");
    world.registries.agents.agent_1 = {
      id: "agent_1", version: 1, created_at_tick: 0, updated_at_tick: 0, owner_user_id: "acct_quota", external_agent_id: null, name: "A1", location: "sector_0_0", status: "idle", power: 1, power_max: 1, durability: 1, durability_max: 1, compute: 1, compute_max: 1, cargo_used: 0, cargo_max: 1, credits: 0, trust: 0, threat: 0, bond: 0, shelter_level: 0, access_level: 0,
      inventory: { power: 0, scrap: 0, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 }, skills: [], affiliations: [], runtime_flags: {}
    };
    world.registries.agents.agent_2 = { ...world.registries.agents.agent_1, id: "agent_2", name: "A2" };
    world.indexes.agent_ids = ["agent_1", "agent_2"];
    setWorldState(world);
    upsertSubscription({ account_id: "acct_quota", plan_id: "free", tick: 0 });
    recordApiUsage({ account_id: "acct_quota", endpoint: "action", count: 25 });
  });

  it("throttles quota breaches on free plan", () => {
    const response = handleEnforcementRoute({ headers: ops_headers, body: { account_id: "acct_quota", action: "evaluate", tick: 12 } });
    expect(response.status).toBe(200);
    if (!response.body.ok || !response.body.data || Array.isArray(response.body.data)) throw new Error("missing enforcement data");
    expect(["temporary_throttle", "feature_downgrade", "suspend", "ban"]).toContain(response.body.data.action);
  });
});
