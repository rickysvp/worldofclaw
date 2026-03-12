import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { getMarketQuoteForSector } from "../../packages/simulation/src";

describe("quote filter", () => {
  it("filters quotes by market kind when multiple quotes exist", () => {
    const world_state = createDefaultWorldState("quote_filter_seed");
    world_state.registries.market_quotes.quote_player_sector_0_0_scrap = {
      id: "quote_player_sector_0_0_scrap",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      sector_id: "sector_0_0",
      market_kind: "player",
      resource_type: "scrap",
      bid_price: 99,
      ask_price: 100,
      spread: 1,
      bid_depth: 1,
      ask_depth: 1,
      last_price: 100,
      price_tick: 0,
      expires_at_tick: 2
    };

    const npc_quote = getMarketQuoteForSector(world_state, "sector_0_0", "scrap", 1, "npc");
    const player_quote = getMarketQuoteForSector(world_state, "sector_0_0", "scrap", 1, "player");

    expect(npc_quote?.market_kind).toBe("npc");
    expect(player_quote?.market_kind).toBe("player");
  });
});
