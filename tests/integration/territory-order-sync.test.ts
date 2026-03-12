import { describe, expect, it } from "vitest";
import { deriveProtectedZones, deriveTerritoryOrder, syncAccessPolicyFromOrganization } from "../../packages/social/src";

describe("territory order sync", () => {
  it("derives protected zones and access policies from an organization", () => {
    const organization = {
      organization_id: "org_territory",
      organization_type: "outpost",
      name: "Territory Org",
      members: [{ agent_id: "a", role: "founder", joined_at_tick: 0, trade_count: 0, maintenance_count: 0, defense_count: 0 }],
      controlled_sector_ids: ["sector_0_0"],
      controlled_facility_ids: ["f1"],
      controlled_facility_types: ["shelter"],
      treasury: { credits: 0, income_24h: 0, expense_24h: 0, net_24h: 0 },
      governance: { tax_rate_bps: 500, service_fee_bps: 300, treasury_split_bps: 2000 },
      health: { cohesion: 30, stability: 60, split_risk: 10, dissolve_risk: 10 },
      runtime: { founder_agent_id: "a", maintainer_agent_ids: [], trader_agent_ids: [], guest_agent_ids: [], formed_at_tick: 0, last_active_tick: 0, access_mode: "members_only" }
    } as const;
    expect(deriveProtectedZones([organization as never])).toEqual(["sector_0_0"]);
    expect(deriveTerritoryOrder([organization as never])[0]?.protected_zone).toBe(true);
    expect(syncAccessPolicyFromOrganization(organization as never).sector_access_policy).toBe("members_only");
    expect(syncAccessPolicyFromOrganization(organization as never).facility_access_policy).toBe("members_only");
  });
});
