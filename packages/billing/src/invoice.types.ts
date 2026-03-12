import type { billing_currency, invoice_statuses } from "./constants";
import type { BillingPlanId } from "./plan.types";

export type InvoiceStatus = (typeof invoice_statuses)[number];
export type BillingCurrency = typeof billing_currency;

export type InvoiceLineItem = {
  line_id: string;
  meter_ids: string[];
  description: string;
  quantity: number;
  unit_price: number;
  amount: number;
  reason_code: string;
};

export type BillingInvoice = {
  invoice_id: string;
  account_id: string;
  plan_id: BillingPlanId;
  currency: BillingCurrency;
  status: InvoiceStatus;
  issued_at_tick: number;
  due_at_tick: number;
  line_items: InvoiceLineItem[];
  subtotal: number;
  total: number;
  settlement_id: string | null;
};

export type CreditNote = {
  credit_note_id: string;
  invoice_id: string;
  account_id: string;
  amount: number;
  reason_code: string;
  issued_at_tick: number;
};
