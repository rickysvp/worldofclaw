import { describe, expect, it } from "vitest";
import { getAttackHostilityDelta, getBreachHostilityDelta } from "../../packages/social/src";

describe("hostility rules", () => {
  it("applies attack hostility", () => {
    expect(getAttackHostilityDelta(false).hostility_delta).toBe(15);
    expect(getAttackHostilityDelta(true).hostility_delta).toBe(20);
  });

  it("adds breach hostility", () => {
    expect(getBreachHostilityDelta().hostility_delta).toBe(5);
  });
});
