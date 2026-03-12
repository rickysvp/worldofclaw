import { describe, expect, it } from "vitest";
import { getMutualDefenseBondDelta, getSharedFacilityBondDelta } from "../../packages/social/src";

describe("bond rules", () => {
  it("adds bond for shared facilities and defense", () => {
    expect(getSharedFacilityBondDelta().bond_delta).toBe(1);
    expect(getMutualDefenseBondDelta().bond_delta).toBe(3);
  });
});
