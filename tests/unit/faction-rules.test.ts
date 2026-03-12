import { describe, expect, it } from "vitest";
import { canFormFaction, createEmptyRelation, createFactionState } from "../../packages/social/src";

describe("faction rules", () => {
  it("requires members, stable income, trust, facilities and access difference", () => {
    const relation = { ...createEmptyRelation("a", "b", 0), trust: 35 };
    expect(canFormFaction({
      organization_id: "org_1",
      member_agent_ids: ["a", "b", "c", "d", "e"],
      controlled_facilities: [
        { id: "f1", facility_type: "shelter" },
        { id: "f2", facility_type: "generator" }
      ] as never,
      internal_relations: [relation],
      treasury_ledger: [{ entity_id: "org_1", counterparty_entity_id: null, tick: 1, credits_delta: 20, note: "income", payload: {} }],
      has_access_difference: true,
      current_tick: 24
    })).toBe(true);
  });

  it("creates an auditable faction transition", () => {
    const relation = { ...createEmptyRelation("a", "b", 0), trust: 35 };
    const transition = createFactionState({
      organization_id: "org_1",
      name: "Harbor League",
      founder_agent_id: "a",
      member_agent_ids: ["a", "b", "c", "d", "e"],
      controlled_sector_ids: ["sector_0_0", "sector_0_1"],
      controlled_facilities: [
        { id: "f1", facility_type: "shelter" },
        { id: "f2", facility_type: "generator" }
      ] as never,
      internal_relations: [relation],
      treasury_ledger: [{ entity_id: "org_1", counterparty_entity_id: null, tick: 24, credits_delta: 20, note: "income", payload: {} }],
      tick: 24
    });

    expect(transition.next_state.organization_type).toBe("faction");
    expect(transition.events[0]?.code).toBe("organization_faction_formed");
    expect(transition.ledger_entries[0]?.note).toBe("organization_faction_formed");
  });
});
