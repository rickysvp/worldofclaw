import { describe, expect, it } from "vitest";
import { createCreditNote } from "../../packages/billing/src";
import { resolveDispute, type BillingDispute } from "../../packages/risk/src";

describe("dispute rules", () => {
  it("creates credit notes for approved disputes", () => {
    const dispute: BillingDispute = {
      dispute_id: "disp_1",
      invoice_id: "inv_1",
      account_id: "acct_1",
      reason_code: "bad_bill",
      status: "open",
      requested_amount: 50
    };
    const resolution = resolveDispute({
      dispute,
      approved: true,
      approved_amount: 20,
      max_credit_amount: 20,
      issued_at_tick: 12,
      createCreditNote: (amount) => createCreditNote({ credit_note_id: "cn_1", invoice_id: "inv_1", account_id: "acct_1", amount, issued_at_tick: 12 })
    });
    expect(resolution.credit_note?.amount).toBe(20);
    expect(resolution.dispute.status).toBe("resolved");
  });
});
