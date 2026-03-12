import { describe, expect, it } from "vitest";
import { canFormOutpost, createEmptyRelation, createOutpostState } from "../../packages/social/src";

describe("outpost rules", () => {
  it("requires agents, key facilities, positive trade and bond", () => {
    const relation = { ...createEmptyRelation("a", "b", 0), bond: 25 };
    expect(canFormOutpost({
      active_agent_ids: ["a", "b", "c"],
      controlled_facilities: [
        { id: "f1", facility_type: "shelter" },
        { id: "f2", facility_type: "generator" }
      ] as never,
      internal_relations: [relation],
      internal_trade_net_positive: true,
      hold_ticks: 12
    })).toBe(true);
  });

  it("creates an auditable outpost transition", () => {
    const relation = { ...createEmptyRelation("a", "b", 0), bond: 25 };
    const transition = createOutpostState({
      organization_id: "org_outpost_1",
      name: "Dust Harbor",
      founder_agent_id: "a",
      member_agent_ids: ["a", "b", "c"],
      controlled_sector_ids: ["sector_0_0"],
      controlled_facilities: [
        { id: "f1", facility_type: "shelter" },
        { id: "f2", facility_type: "generator" }
      ] as never,
      internal_relations: [relation],
      treasury_ledger: [],
      tick: 12
    });

    expect(transition.next_state.organization_type).toBe("outpost");
    expect(transition.events[0]?.code).toBe("organization_outpost_formed");
    expect(transition.ledger_entries[0]?.note).toBe("organization_outpost_formed");
  });
});
