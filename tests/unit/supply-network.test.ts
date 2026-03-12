import { describe, expect, it } from "vitest";
import { createEmptyRelation, deriveSupplyNetworkCandidates, qualifiesForSupplyNetwork } from "../../packages/social/src";

describe("supply network", () => {
  it("qualifies repeated trade relations as supply networks", () => {
    const relation = {
      ...createEmptyRelation("a", "b", 0),
      trust: 25,
      bond: 10,
      successful_trade_ticks: [1, 2, 3, 4]
    };
    expect(qualifiesForSupplyNetwork(relation, 12)).toBe(true);
    expect(deriveSupplyNetworkCandidates([relation], 12)[0]?.member_agent_ids).toEqual(["a", "b"]);
  });

  it("merges chained qualifying relations into one network", () => {
    const relation_ab = {
      ...createEmptyRelation("a", "b", 0),
      trust: 25,
      bond: 10,
      successful_trade_ticks: [1, 2, 3, 4]
    };
    const relation_bc = {
      ...createEmptyRelation("b", "c", 0),
      trust: 24,
      bond: 9,
      successful_trade_ticks: [2, 3, 4, 5]
    };

    const candidates = deriveSupplyNetworkCandidates([relation_ab, relation_bc], 12);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]?.member_agent_ids).toEqual(["a", "b", "c"]);
  });
});
