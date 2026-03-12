import type { RevenueReasonCode } from "../settlement.types";

export type TaxPolicyInput = {
  reason_code: RevenueReasonCode;
  sector_tax_bps?: number;
};

export const getTaxBps = (input: TaxPolicyInput): number => Math.max(0, input.sector_tax_bps ?? 0);
