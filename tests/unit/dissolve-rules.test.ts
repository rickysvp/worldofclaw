import { describe, expect, it } from "vitest";
import { shouldDissolveOrganization } from "../../packages/social/src";

describe("dissolve rules", () => {
  it("dissolves weak organizations with too few members", () => {
    expect(shouldDissolveOrganization({
      organization_id: "org",
      organization_type: "outpost",
      name: "Org",
      members: [],
      controlled_sector_ids: [],
      controlled_facility_ids: [],
      controlled_facility_types: [],
      treasury: { credits: 0, income_24h: 0, expense_24h: 0, net_24h: 0 },
      governance: { tax_rate_bps: 0, service_fee_bps: 0, treasury_split_bps: 0 },
      health: { cohesion: 0, stability: 10, split_risk: 0, dissolve_risk: 95 },
      runtime: { founder_agent_id: "a", maintainer_agent_ids: [], trader_agent_ids: [], guest_agent_ids: [], formed_at_tick: 0, last_active_tick: 0, access_mode: "open" }
    })).toBe(true);
  });
});
