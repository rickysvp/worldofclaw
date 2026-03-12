import { describe, expect, it } from "vitest";
import { summarizeTreasuryFromLedger } from "../../packages/economy/src";

describe("treasury summary", () => {
  it("aggregates treasury revenue by reason and tick", () => {
    const summary = summarizeTreasuryFromLedger([
      {
        id: "ledger_1",
        tick: 1,
        kind: "credits_delta",
        resource_type: null,
        amount_delta: 0,
        credits_delta: 2,
        entity_id: "platform_treasury",
        counterparty_entity_id: "agent_a",
        action_ref: "action_1",
        note: "npc trade fee",
        payload: { reason_code: "npc_trade" }
      },
      {
        id: "ledger_2",
        tick: 1,
        kind: "credits_delta",
        resource_type: null,
        amount_delta: 0,
        credits_delta: 3,
        entity_id: "platform_treasury",
        counterparty_entity_id: "agent_b",
        action_ref: "action_2",
        note: "charge fee",
        payload: { reason_code: "charge_service" }
      }
    ]);

    expect(summary.total_revenue).toBe(5);
    expect(summary.entry_count).toBe(2);
    expect(summary.by_reason.npc_trade).toBe(2);
    expect(summary.by_tick["1"]).toBe(5);
  });
});
