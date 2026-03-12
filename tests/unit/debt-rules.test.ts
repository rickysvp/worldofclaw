import { describe, expect, it } from "vitest";
import { getAidDebtDelta, settleDebt } from "../../packages/social/src";

describe("debt rules", () => {
  it("creates trust and debt on aid", () => {
    const delta = getAidDebtDelta({ helper_agent_id: "a", helped_agent_id: "b", tick: 1, debt_amount: 12 });
    expect(delta.trust_delta).toBe(8);
    expect(delta.debt_delta).toBe(12);
  });

  it("settles debt without going negative", () => {
    expect(settleDebt(10, 3)).toBe(7);
    expect(settleDebt(10, 30)).toBe(0);
  });
});
