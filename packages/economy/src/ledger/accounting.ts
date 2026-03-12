import type { LedgerEntry } from "../../../schemas/src";
import type { StructuredSettlement } from "../settlement.types";

export type LedgerPostingInput = Omit<LedgerEntry, "id">;

export const createSettlementLedgerEntries = (
  settlement: StructuredSettlement,
  action_ref: string | null,
  counterparty_entity_id?: string | null
): LedgerPostingInput[] =>
  settlement.postings.map((posting) => {
    const payload: LedgerPostingInput["payload"] = {
      settlement_id: settlement.settlement_id,
      payer: settlement.payer,
      payee: settlement.payee,
      platform_cut: settlement.platform_cut,
      facility_cut: settlement.facility_cut,
      net_amount: settlement.net_amount,
      reason_code: settlement.reason_code
    };
    if (settlement.owner_payee !== null) {
      payload.owner_payee = settlement.owner_payee;
    }

    return {
      tick: settlement.tick,
      kind: "credits_delta",
      resource_type: null,
      amount_delta: 0,
      credits_delta: posting.credits_delta,
      entity_id: posting.entity_id,
      counterparty_entity_id: counterparty_entity_id ?? null,
      action_ref,
      note: posting.note,
      payload
    };
  });
