import { platform_treasury_entity_id } from "../constants";
import type { StructuredSettlement, SettlementInvoice } from "../settlement.types";
import { calculateRevenueSplit } from "./revenue-split";

export const executeSettlement = (invoice: SettlementInvoice): StructuredSettlement => {
  const split = calculateRevenueSplit({
    gross_amount: invoice.gross_amount,
    platform_fee_bps: invoice.platform_fee_bps,
    facility_fee_bps: invoice.facility_fee_bps,
    tax_bps: invoice.tax_bps
  });

  const postings = [
    {
      entity_id: invoice.payer,
      credits_delta: -invoice.gross_amount,
      note: `${invoice.reason_code} gross payment`
    }
  ];

  if (split.net_amount > 0) {
    postings.push({
      entity_id: invoice.payee,
      credits_delta: split.net_amount,
      note: `${invoice.reason_code} net revenue`
    });
  }

  if (split.platform_cut > 0) {
    postings.push({
      entity_id: platform_treasury_entity_id,
      credits_delta: split.platform_cut,
      note: `${invoice.reason_code} platform revenue`
    });
  }

  if (split.facility_cut > 0) {
    postings.push({
      entity_id: invoice.owner_payee ?? invoice.payee,
      credits_delta: split.facility_cut,
      note: `${invoice.reason_code} facility owner revenue`
    });
  }

  if (split.tax_amount > 0) {
    postings.push({
      entity_id: platform_treasury_entity_id,
      credits_delta: split.tax_amount,
      note: `${invoice.reason_code} tax revenue`
    });
  }

  return {
    settlement_id: invoice.settlement_id,
    tick: invoice.tick,
    payer: invoice.payer,
    payee: invoice.payee,
    owner_payee: invoice.owner_payee,
    gross_amount: invoice.gross_amount,
    platform_cut: split.platform_cut + split.tax_amount,
    facility_cut: split.facility_cut,
    tax_amount: split.tax_amount,
    net_amount: split.net_amount,
    reason_code: invoice.reason_code,
    postings
  };
};
