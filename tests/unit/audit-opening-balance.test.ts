import { describe, expect, it } from "vitest";
import { auditLedgerCreditsNonNegative, auditLedgerCreditsNonNegativeWithOpeningBalances } from "../../packages/economy/src";

describe("audit opening balances", () => {
  it("supports opening balances to avoid seeded false negatives", () => {
    const entries = [
      {
        id: "ledger_1",
        tick: 1,
        kind: "credits_delta" as const,
        resource_type: null,
        amount_delta: 0,
        credits_delta: -5,
        entity_id: "npc_market_sector_0_0",
        counterparty_entity_id: null,
        action_ref: "action_1",
        note: "seller payout",
        payload: {}
      }
    ];

    expect(auditLedgerCreditsNonNegative(entries).ok).toBe(false);
    expect(auditLedgerCreditsNonNegativeWithOpeningBalances(entries, { npc_market_sector_0_0: 100000 }).ok).toBe(true);
  });
});
