import { describe, expect, it } from "vitest";
import { auditLedgerCreditsNonNegative, auditSettlement, auditTradeSettlementConsistency, buildInvoice, buildMarketTrade, executeSettlement } from "../../packages/economy/src";

describe("economy audit", () => {
  it("accepts balanced settlements", () => {
    const settlement = executeSettlement(
      buildInvoice({
        settlement_id: "settlement_audit_1",
        tick: 1,
        payer: "agent_a",
        payee: "facility_b",
        gross_amount: 10,
        reason_code: "repair_service",
        has_player_owner: true
      })
    );

    expect(auditSettlement(settlement).ok).toBe(true);
  });

  it("flags negative running ledger balances", () => {
    const result = auditLedgerCreditsNonNegative([
      {
        id: "ledger_bad_1",
        tick: 1,
        kind: "credits_delta",
        resource_type: null,
        amount_delta: 0,
        credits_delta: -5,
        entity_id: "agent_a",
        counterparty_entity_id: null,
        action_ref: "action_a",
        note: "bad debit",
        payload: {}
      }
    ]);

    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("NEGATIVE_LEDGER_BALANCE");
  });

  it("detects mismatched trade and settlement amounts", () => {
    const settlement = executeSettlement(
      buildInvoice({
        settlement_id: "settlement_audit_2",
        tick: 2,
        payer: "npc_market_sector_0_0",
        payee: "agent_a",
        gross_amount: 6,
        reason_code: "npc_trade",
        has_player_owner: false
      })
    );
    const trade = buildMarketTrade({
      id: "trade_1",
      order_id: "order_1",
      sector_id: "sector_0_0",
      market_kind: "npc",
      side: "sell",
      agent_id: "agent_a",
      resource_type: "scrap",
      quantity: 1,
      unit_price: 6,
      tick: 2,
      settlement: {
        ...settlement,
        platform_cut: settlement.platform_cut + 1
      }
    });

    const result = auditTradeSettlementConsistency(trade, settlement);
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("TRADE_SETTLEMENT_AMOUNT_MISMATCH");
  });
});
