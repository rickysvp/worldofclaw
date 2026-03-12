import { describe, expect, it } from "vitest";
import { calculateChargeTransfer } from "../../packages/rules/src";

describe("charging rules", () => {
  it("converts 1 credit into 2 power", () => {
    const result = calculateChargeTransfer({
      available_facility_power: 10,
      agent_power: 0,
      agent_power_max: 10,
      agent_credits: 3
    });
    expect(result.transferred_power).toBe(6);
    expect(result.spent_credits).toBe(3);
  });
});
