import { describe, expect, it } from "vitest";
import { createEmptyRelation, getSuccessfulTradeTrustDelta, getContractBreachTrustDelta, applyRelationDelta } from "../../packages/social/src";

describe("trust rules", () => {
  it("adds trust for successful trade and grants streak bonus on third trade", () => {
    let relation = createEmptyRelation("a", "b", 0);
    relation = applyRelationDelta(relation, getSuccessfulTradeTrustDelta(relation, 1), 1);
    relation = applyRelationDelta(relation, getSuccessfulTradeTrustDelta(relation, 2), 2);
    relation = applyRelationDelta(relation, getSuccessfulTradeTrustDelta(relation, 3), 3);
    expect(relation.trust).toBe(11);
  });

  it("penalizes trust on breach", () => {
    const relation = applyRelationDelta(createEmptyRelation("a", "b", 0), getContractBreachTrustDelta(), 1);
    expect(relation.trust).toBe(-15);
  });
});
