import { describe, expect, it } from "vitest";
import { createEmptyRelation, createFactionState, deriveGovernance } from "../../packages/social/src";

describe("trust to faction flow", () => {
  it("forms a faction from trusted members with income and facility diversity", () => {
    const relation = { ...createEmptyRelation("a", "b", 0), trust: 35, bond: 25 };
    const faction = createFactionState({
      organization_id: "org_faction_1",
      name: "Harbor League",
      founder_agent_id: "a",
      member_agent_ids: ["a", "b", "c", "d", "e"],
      controlled_sector_ids: ["sector_0_0", "sector_0_1"],
      controlled_facilities: [
        { id: "f1", facility_type: "generator" },
        { id: "f2", facility_type: "storage" }
      ] as never,
      internal_relations: [relation],
      treasury_ledger: [{ entity_id: "org_faction_1", counterparty_entity_id: null, tick: 1, credits_delta: 20, note: "income", payload: {} }],
      tick: 24
    });
    expect(faction.next_state.governance).toEqual(deriveGovernance("faction"));
    expect(faction.next_state.members.length).toBe(5);
    expect(faction.events[0]?.code).toBe("organization_faction_formed");
  });
});
