import { describe, expect, it } from "vitest";
import { calculateRepairOutcome, canRepairDurability } from "../../packages/rules/src";

describe("repair rules", () => {
  it("consumes 1 scrap and 1 power to restore 10 durability", () => {
    expect(canRepairDurability({ available_scrap: 1, available_power: 1, current_durability: 10, durability_max: 30 })).toBe(true);
    expect(calculateRepairOutcome({ current_durability: 10, durability_max: 30 }).durability_gain).toBe(10);
  });
});
