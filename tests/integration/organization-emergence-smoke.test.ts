import { describe, expect, it } from "vitest";
import { createEmptyRelation, createOutpostState, deriveSupplyNetworkCandidates } from "../../packages/social/src";

describe("organization emergence smoke", () => {
  it("promotes repeated cooperation into a supply network and outpost candidate", () => {
    const relation = { ...createEmptyRelation("a", "b", 0), trust: 28, bond: 24, successful_trade_ticks: [1, 2, 3, 4] };
    const candidates = deriveSupplyNetworkCandidates([relation], 12);
    expect(candidates.length).toBe(1);
    const outpost = createOutpostState({
      organization_id: "org_outpost_1",
      name: "Dust Harbor",
      founder_agent_id: "a",
      member_agent_ids: ["a", "b", "c"],
      controlled_sector_ids: ["sector_0_0"],
      controlled_facilities: [
        { id: "shelter_1", facility_type: "shelter" },
        { id: "gen_1", facility_type: "generator" }
      ] as never,
      internal_relations: [relation],
      treasury_ledger: [{ entity_id: "org_outpost_1", counterparty_entity_id: null, tick: 1, credits_delta: 10, note: "income", payload: {} }],
      tick: 12
    });
    expect(outpost.next_state.organization_type).toBe("outpost");
    expect(outpost.events[0]?.code).toBe("organization_outpost_formed");
  });
});
