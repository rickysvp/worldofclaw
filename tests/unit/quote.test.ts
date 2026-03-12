import { describe, expect, it } from "vitest";
import { buildQuote } from "../../packages/economy/src";

describe("quote", () => {
  it("adds expiry and spread to built quotes", () => {
    const quote = buildQuote({
      id: "quote_1",
      sector_id: "sector_0_0",
      market_kind: "npc",
      resource_type: "scrap",
      mid_price: 10,
      bid_depth: 4,
      ask_depth: 5,
      tick: 3,
      last_price: null
    });

    expect(quote.bid_price).toBe(8);
    expect(quote.ask_price).toBe(12);
    expect(quote.expires_at_tick).toBe(5);
  });
});
