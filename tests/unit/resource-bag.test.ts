import { describe, expect, it } from "vitest";
import { addResourceDelta, createResourceBag, subtractResourceCost } from "../../packages/rules/src";

describe("resource bag", () => {
  it("adds deltas within capacity", () => {
    const bag = createResourceBag({ scrap: 1 });
    const result = addResourceDelta(bag, { scrap: 2 }, { scrap: 10 });
    expect(result.ok).toBe(true);
    expect(result.bag.scrap).toBe(3);
  });

  it("prevents negative balances", () => {
    const bag = createResourceBag({ scrap: 1 });
    const result = subtractResourceCost(bag, { scrap: 2 });
    expect(result.ok).toBe(false);
    expect(result.issues[0]?.code).toBe("RESOURCE_INSUFFICIENT");
    expect(result.bag.scrap).toBe(1);
  });
});
