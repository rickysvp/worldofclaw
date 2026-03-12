import { describe, expect, it } from "vitest";
import { calculateRevenueSplit } from "../../packages/economy/src";

describe("revenue split", () => {
  it("keeps allocations within gross amount", () => {
    const split = calculateRevenueSplit({ gross_amount: 1, platform_fee_bps: 2000, facility_fee_bps: 8000, tax_bps: 0 });
    expect(split.platform_cut + split.facility_cut + split.tax_amount + split.net_amount).toBe(1);
  });

  it("reserves at least one credit for low gross platform fees", () => {
    const split = calculateRevenueSplit({ gross_amount: 4, platform_fee_bps: 300, facility_fee_bps: 0, tax_bps: 0 });
    expect(split.platform_cut).toBe(1);
  });
});
