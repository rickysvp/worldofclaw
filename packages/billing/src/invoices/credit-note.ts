import { default_credit_note_reason } from "../constants";
import type { CreditNote } from "../invoice.types";

export const createCreditNote = (input: {
  credit_note_id: string;
  invoice_id: string;
  account_id: string;
  amount: number;
  issued_at_tick: number;
  reason_code?: string;
}): CreditNote => ({
  credit_note_id: input.credit_note_id,
  invoice_id: input.invoice_id,
  account_id: input.account_id,
  amount: input.amount,
  reason_code: input.reason_code ?? default_credit_note_reason,
  issued_at_tick: input.issued_at_tick
});
