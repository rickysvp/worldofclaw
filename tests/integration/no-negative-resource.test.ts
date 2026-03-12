import { describe, expect, it } from "vitest";
import { createResourceBag, subtractResourceCost, validateResourceBag } from "../../packages/rules/src";

describe("no negative resource", () => {
  it("never allows negative resources through the rules layer", () => {
    const result = subtractResourceCost(createResourceBag({ scrap: 0, power: 0 }), { scrap: 1, power: 1 });
    expect(result.ok).toBe(false);
    expect(validateResourceBag(result.bag)).toHaveLength(0);
    expect(result.bag.scrap).toBe(0);
    expect(result.bag.power).toBe(0);
  });
});
