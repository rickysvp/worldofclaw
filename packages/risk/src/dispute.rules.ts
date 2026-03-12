import type { CreditNote } from "../../billing/src";

export type BillingDispute = {
  dispute_id: string;
  invoice_id: string;
  account_id: string;
  reason_code: string;
  status: "open" | "under_review" | "resolved" | "rejected";
  requested_amount: number;
};

export type DisputeResolution = {
  dispute: BillingDispute;
  credit_note: CreditNote | null;
  enforcement_release: boolean;
};

export const resolveDispute = (input: {
  dispute: BillingDispute;
  approved: boolean;
  approved_amount: number;
  max_credit_amount: number;
  issued_at_tick: number;
  createCreditNote: (amount: number) => CreditNote;
}): DisputeResolution => {
  if (!input.approved) {
    return {
      dispute: { ...input.dispute, status: "rejected" },
      credit_note: null,
      enforcement_release: false
    };
  }

  const approved_amount = Math.max(0, Math.min(input.approved_amount, input.dispute.requested_amount, input.max_credit_amount));

  return {
    dispute: { ...input.dispute, status: "resolved" },
    credit_note: approved_amount > 0 ? input.createCreditNote(approved_amount) : null,
    enforcement_release: true
  };
};
