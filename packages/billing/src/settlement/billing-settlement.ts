import type { BillingInvoice, CreditNote } from "../invoice.types";

export type BillingSettlement = {
  settlement_id: string;
  invoice_id: string;
  account_id: string;
  amount: number;
  status: "paid" | "credited";
  meter_refs: string[];
};

export const settleBillingInvoice = (invoice: BillingInvoice): BillingSettlement => ({
  settlement_id: `billing_settlement_${invoice.invoice_id}`,
  invoice_id: invoice.invoice_id,
  account_id: invoice.account_id,
  amount: invoice.total,
  status: "paid",
  meter_refs: invoice.line_items.flatMap((line) => line.meter_ids)
});

export const settleCreditNote = (credit_note: CreditNote): BillingSettlement => ({
  settlement_id: `billing_credit_${credit_note.credit_note_id}`,
  invoice_id: credit_note.invoice_id,
  account_id: credit_note.account_id,
  amount: credit_note.amount,
  status: "credited",
  meter_refs: []
});
