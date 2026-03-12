import { describe, expect, it } from "vitest";
import { applyPublicRepairFame, createReputationRecord, getPublicFacilityRepairFameGain } from "../../packages/social/src";

describe("fame rules", () => {
  it("grants more fame for critical public facilities", () => {
    expect(getPublicFacilityRepairFameGain("generator")).toBe(15);
    expect(getPublicFacilityRepairFameGain("workshop")).toBe(5);
  });

  it("caps fame at 100", () => {
    const reputation = { ...createReputationRecord("agent_a", 0), fame: 95 };
    expect(applyPublicRepairFame(reputation, "generator", 1).fame).toBe(100);
  });
});
