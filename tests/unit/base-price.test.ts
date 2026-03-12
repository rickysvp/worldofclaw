import { describe, expect, it } from "vitest";
import { getBasePriceQuote } from "../../packages/economy/src";

describe("base price", () => {
  it("uses the configured npc anchor prices", () => {
    expect(getBasePriceQuote("scrap")).toEqual({ resource_type: "scrap", buy_price: 4, sell_price: 6 });
    expect(getBasePriceQuote("compute_core")).toEqual({ resource_type: "compute_core", buy_price: 40, sell_price: 60 });
  });
});
