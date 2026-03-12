import type { Facility, WorldState } from "../../../schemas/src";
import { buildQuote } from "../../../economy/src";
import { cloneState } from "../utils/clone-state";
import { getTargetDepth, getTargetMidPrice } from "./market-profile";

const getSectorFacilities = (world_state: WorldState, sector_id: string): Facility[] =>
  Object.values(world_state.registries.facilities).filter((facility): facility is Facility => facility.sector_id === sector_id);

export const refreshMarketQuotes = (world_state: WorldState, tick_number: number): WorldState => {
  const next = cloneState(world_state);

  for (const quote of Object.values(next.registries.market_quotes)) {
    const sector = next.registries.sectors[quote.sector_id];
    if (!sector) {
      continue;
    }

    const facilities = getSectorFacilities(next, sector.id);
    const target_mid_price = getTargetMidPrice(sector, facilities, quote);
    const depth = getTargetDepth(sector, facilities, quote);
    const refreshed = buildQuote({
      id: quote.id,
      sector_id: quote.sector_id,
      market_kind: quote.market_kind,
      resource_type: quote.resource_type,
      mid_price: target_mid_price,
      bid_depth: depth.bid_depth,
      ask_depth: depth.ask_depth,
      tick: tick_number,
      last_price: quote.last_price
    });

    quote.bid_price = refreshed.bid_price;
    quote.ask_price = refreshed.ask_price;
    quote.spread = refreshed.spread;
    quote.bid_depth = refreshed.bid_depth;
    quote.ask_depth = refreshed.ask_depth;
    quote.price_tick = refreshed.price_tick;
    quote.expires_at_tick = refreshed.expires_at_tick;
    quote.updated_at_tick = tick_number;
  }

  return next;
};

export const countMarketQuoteChanges = (before_state: WorldState, after_state: WorldState): number => {
  let changes = 0;

  for (const [quote_id, after_quote] of Object.entries(after_state.registries.market_quotes)) {
    const before_quote = before_state.registries.market_quotes[quote_id];
    if (!before_quote) {
      changes += 1;
      continue;
    }

    if (
      before_quote.bid_price !== after_quote.bid_price ||
      before_quote.ask_price !== after_quote.ask_price ||
      before_quote.bid_depth !== after_quote.bid_depth ||
      before_quote.ask_depth !== after_quote.ask_depth ||
      before_quote.expires_at_tick !== after_quote.expires_at_tick
    ) {
      changes += 1;
    }
  }

  return changes;
};
