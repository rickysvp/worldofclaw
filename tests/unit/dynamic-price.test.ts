import { describe, expect, it } from "vitest";
import { applyDynamicPrice, getScarcityMultiplier } from "../../packages/economy/src";

describe("dynamic price", () => {
  it("clamps scarcity multiplier into the configured range", () => {
    expect(getScarcityMultiplier({ previous_mid_price: null, base_mid_price: 10, supply_signal: 1, demand_signal: 99 })).toBeLessThanOrEqual(1.8);
    expect(getScarcityMultiplier({ previous_mid_price: null, base_mid_price: 10, supply_signal: 99, demand_signal: 1 })).toBeGreaterThanOrEqual(0.7);
  });

  it("limits single tick price movement to 15 percent", () => {
    expect(applyDynamicPrice({ previous_mid_price: 100, base_mid_price: 200, supply_signal: 1, demand_signal: 99 })).toBeLessThanOrEqual(115);
  });
});
