import { describe, expect, it } from "vitest";
import { buildInvoice, executeSettlement } from "../../packages/economy/src";

describe("settlement engine", () => {
  it("builds structured settlements with payer, payee, and cuts", () => {
    const invoice = buildInvoice({
      settlement_id: "settlement_1",
      tick: 1,
      payer: "agent_a",
      payee: "facility_b",
      gross_amount: 10,
      reason_code: "repair_service",
      has_player_owner: true
    });
    const settlement = executeSettlement(invoice);

    expect(settlement.payer).toBe("agent_a");
    expect(settlement.payee).toBe("facility_b");
    expect(settlement.platform_cut).toBeGreaterThan(0);
    expect(settlement.postings.reduce((sum, posting) => sum + posting.credits_delta, 0)).toBe(0);
  });
});
