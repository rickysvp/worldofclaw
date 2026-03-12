import { describe, expect, it } from "vitest";
import { deriveOrganizationTreasury } from "../../packages/social/src";

describe("social treasury window", () => {
  it("limits income_24h and net_24h to the recent tick window", () => {
    const treasury = deriveOrganizationTreasury(
      "org_1",
      [
        { entity_id: "org_1", counterparty_entity_id: null, tick: 1, credits_delta: 100, note: "old_income", payload: {} },
        { entity_id: "org_1", counterparty_entity_id: null, tick: 24, credits_delta: 30, note: "recent_income", payload: {} },
        { entity_id: "org_1", counterparty_entity_id: null, tick: 25, credits_delta: -10, note: "recent_expense", payload: {} }
      ],
      25
    );

    expect(treasury.credits).toBe(120);
    expect(treasury.income_24h).toBe(30);
    expect(treasury.expense_24h).toBe(10);
    expect(treasury.net_24h).toBe(20);
  });
});
