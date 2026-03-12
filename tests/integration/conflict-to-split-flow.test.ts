import { describe, expect, it } from "vitest";
import { createEmptyRelation, shouldSplitOrganization } from "../../packages/social/src";

describe("conflict to split flow", () => {
  it("marks a hostile organization as split prone", () => {
    const organization = {
      organization_id: "org_conflict",
      organization_type: "faction",
      name: "Conflict Org",
      members: [
        { agent_id: "a", role: "founder", joined_at_tick: 0, trade_count: 0, maintenance_count: 0, defense_count: 0 },
        { agent_id: "b", role: "member", joined_at_tick: 0, trade_count: 0, maintenance_count: 0, defense_count: 0 }
      ],
      controlled_sector_ids: ["sector_1_1"],
      controlled_facility_ids: ["f1"],
      controlled_facility_types: ["generator"],
      treasury: { credits: 0, income_24h: 0, expense_24h: 20, net_24h: -20 },
      governance: { tax_rate_bps: 500, service_fee_bps: 300, treasury_split_bps: 2000 },
      health: { cohesion: 10, stability: 20, split_risk: 50, dissolve_risk: 10 },
      runtime: { founder_agent_id: "a", maintainer_agent_ids: [], trader_agent_ids: [], guest_agent_ids: [], formed_at_tick: 0, last_active_tick: 0, access_mode: "members_only" }
    } as const;
    const relation = { ...createEmptyRelation("a", "b", 0), trust: -20, hostility: 70 };
    expect(shouldSplitOrganization(organization as never, [relation])).toBe(true);
  });
});
