import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { refreshMarketQuotes } from "../../packages/simulation/src";

describe("price shock smoke", () => {
  it("does not move a quote by more than 15 percent in one tick", () => {
    const world_state = createDefaultWorldState("price_shock_seed");
    const quote_id = "quote_sector_3_0_flux";
    const before = world_state.registries.market_quotes[quote_id]!;
    world_state.registries.sectors.sector_3_0!.resource_stock.flux = 0;
    world_state.registries.sectors.sector_3_0!.resource_regen.flux = 0;

    const next = refreshMarketQuotes(world_state, 1);
    const after = next.registries.market_quotes[quote_id]!;
    expect(after.ask_price).toBeLessThanOrEqual(Math.floor(before.ask_price * 1.15) + 1);
  });
});
