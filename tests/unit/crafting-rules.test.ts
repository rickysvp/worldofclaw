import { describe, expect, it } from "vitest";
import { canCraftResource, createResourceBag, getCraftRecipe } from "../../packages/rules/src";

describe("crafting rules", () => {
  it("provides a circuit recipe and validates inputs", () => {
    expect(getCraftRecipe("circuit")).toEqual({ input: { scrap: 1, flux: 1 }, output: { circuit: 1 } });
    expect(canCraftResource(createResourceBag({ scrap: 1, flux: 1 }), "circuit")).toBe(true);
    expect(canCraftResource(createResourceBag({ scrap: 1, flux: 0 }), "circuit")).toBe(false);
  });
});
