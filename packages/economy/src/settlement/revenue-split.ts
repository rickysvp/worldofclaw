export type RevenueSplitInput = {
  gross_amount: number;
  platform_fee_bps: number;
  facility_fee_bps: number;
  tax_bps: number;
};

export type RevenueSplit = {
  platform_cut: number;
  facility_cut: number;
  tax_amount: number;
  net_amount: number;
};

const calcRequestedCut = (gross_amount: number, bps: number): number => {
  if (gross_amount <= 0 || bps <= 0) {
    return 0;
  }
  return Math.max(1, Math.floor((gross_amount * bps) / 10_000));
};

export const calculateRevenueSplit = (input: RevenueSplitInput): RevenueSplit => {
  let remaining_amount = input.gross_amount;
  const platform_cut = Math.min(remaining_amount, calcRequestedCut(input.gross_amount, input.platform_fee_bps));
  remaining_amount -= platform_cut;
  const facility_cut = Math.min(remaining_amount, calcRequestedCut(input.gross_amount, input.facility_fee_bps));
  remaining_amount -= facility_cut;
  const tax_amount = Math.min(remaining_amount, calcRequestedCut(input.gross_amount, input.tax_bps));
  const net_amount = Math.max(0, input.gross_amount - platform_cut - facility_cut - tax_amount);

  return {
    platform_cut,
    facility_cut,
    tax_amount,
    net_amount
  };
};
