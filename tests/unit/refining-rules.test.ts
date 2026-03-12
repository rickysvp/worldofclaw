import { describe, expect, it } from "vitest";
import { canRefineComputeCore, refining_recipe, resolveRefiningAttempt } from "../../packages/rules/src";

describe("refining rules", () => {
  it("uses the compute_core refinery recipe with 80 percent success", () => {
    expect(refining_recipe.xenite).toBe(2);
    expect(refining_recipe.circuit).toBe(1);
    expect(refining_recipe.power).toBe(2);
    expect(canRefineComputeCore({ xenite: 2, circuit: 1, power: 2 })).toBe(true);
    expect(resolveRefiningAttempt(79).succeeded).toBe(true);
    expect(resolveRefiningAttempt(80).succeeded).toBe(false);
  });
});
