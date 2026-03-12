import { describe, expect, it } from "vitest";
import { syncAccessPolicyFromOrganization } from "../../packages/social/src";

describe("access policy sync", () => {
  it("maps members_only orgs to members_only facility access", () => {
    const sync = syncAccessPolicyFromOrganization({
      organization_id: "org_1",
      organization_type: "outpost",
      name: "Dust Harbor",
      members: [],
      controlled_sector_ids: [],
      controlled_facility_ids: [],
      controlled_facility_types: [],
      treasury: { credits: 0, income_24h: 0, expense_24h: 0, net_24h: 0 },
      governance: { tax_rate_bps: 500, service_fee_bps: 300, treasury_split_bps: 2000 },
      health: { cohesion: 40, stability: 60, split_risk: 10, dissolve_risk: 10 },
      runtime: {
        founder_agent_id: "a",
        maintainer_agent_ids: [],
        trader_agent_ids: [],
        guest_agent_ids: [],
        formed_at_tick: 0,
        last_active_tick: 0,
        access_mode: "members_only"
      }
    });

    expect(sync.sector_access_policy).toBe("members_only");
    expect(sync.facility_access_policy).toBe("members_only");
  });
});
