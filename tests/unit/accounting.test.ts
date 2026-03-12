import { describe, expect, it } from "vitest";
import { buildInvoice, createSettlementLedgerEntries, executeSettlement, summarizeTreasuryFromLedger } from "../../packages/economy/src";

describe("accounting", () => {
  it("turns settlements into ledger entries and summarizes treasury revenue", () => {
    const settlement = executeSettlement(buildInvoice({
      settlement_id: "settlement_2",
      tick: 2,
      payer: "agent_a",
      payee: "facility_b",
      gross_amount: 20,
      reason_code: "player_trade",
      has_player_owner: true
    }));
    const entries = createSettlementLedgerEntries(settlement, "action_2");
    const summary = summarizeTreasuryFromLedger(entries.map((entry, index) => ({ ...entry, id: `ledger_${index}` })));

    expect(entries.length).toBeGreaterThan(1);
    expect(summary.total_revenue).toBeGreaterThan(0);
  });
});
