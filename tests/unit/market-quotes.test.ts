import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { refreshMarketQuotes } from "../../packages/simulation/src";

describe("market quotes", () => {
  it("creates default market quotes for each sector", () => {
    const world_state = createDefaultWorldState("market_quote_seed");
    expect(Object.keys(world_state.registries.market_quotes).length).toBeGreaterThan(0);
    expect(world_state.indexes.market_quote_ids.length).toBe(Object.keys(world_state.registries.market_quotes).length);
  });

  it("adjusts prices upward when local supply is scarce", () => {
    const world_state = createDefaultWorldState("market_quote_refresh_seed");
    const quote_id = "quote_sector_3_0_flux";
    const before = world_state.registries.market_quotes[quote_id];
    expect(before).toBeDefined();
    if (!before) {
      return;
    }

    world_state.registries.sectors["sector_3_0"]!.resource_stock.flux = 0;
    world_state.registries.sectors["sector_3_0"]!.resource_regen.flux = 0;

    const next = refreshMarketQuotes(world_state, 1);
    const after = next.registries.market_quotes[quote_id];
    expect(after?.ask_price).toBeGreaterThan(before.ask_price);
  });

  it("preserves last traded price across quote refreshes", () => {
    const world_state = createDefaultWorldState("market_last_price_seed");
    const quote_id = "quote_sector_0_0_scrap";
    const quote = world_state.registries.market_quotes[quote_id];
    expect(quote).toBeDefined();
    if (!quote) {
      return;
    }

    quote.last_price = 42;

    const next = refreshMarketQuotes(world_state, 1);
    expect(next.registries.market_quotes[quote_id]?.last_price).toBe(42);
  });
});
