import type { SettlementInvoice } from "../settlement.types";
import { getFeePolicy } from "./fee-policy";
import { getTaxBps } from "./tax-policy";

export type BuildInvoiceInput = {
  settlement_id: string;
  tick: number;
  payer: string;
  payee: string;
  owner_payee?: string | null;
  gross_amount: number;
  reason_code: SettlementInvoice["reason_code"];
  has_player_owner: boolean;
  owner_fee_bps?: number;
  sector_tax_bps?: number;
};

export const buildInvoice = (input: BuildInvoiceInput): SettlementInvoice => {
  const fee_policy = getFeePolicy(
    input.owner_fee_bps === undefined
      ? {
          reason_code: input.reason_code,
          has_player_owner: input.has_player_owner
        }
      : {
          reason_code: input.reason_code,
          has_player_owner: input.has_player_owner,
          owner_fee_bps: input.owner_fee_bps
        }
  );
  const tax_bps =
    input.sector_tax_bps === undefined
      ? getTaxBps({ reason_code: input.reason_code })
      : getTaxBps({ reason_code: input.reason_code, sector_tax_bps: input.sector_tax_bps });

  return {
    settlement_id: input.settlement_id,
    tick: input.tick,
    payer: input.payer,
    payee: input.payee,
    owner_payee: input.owner_payee ?? null,
    gross_amount: input.gross_amount,
    platform_fee_bps: fee_policy.platform_fee_bps,
    facility_fee_bps: fee_policy.facility_fee_bps,
    tax_bps,
    reason_code: input.reason_code
  };
};
