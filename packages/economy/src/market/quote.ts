import { quote_ttl_ticks } from "../constants";
import type { EconomyQuote } from "../market.types";

export type BuildQuoteInput = {
  id: string;
  sector_id: string;
  market_kind: EconomyQuote["market_kind"];
  resource_type: EconomyQuote["resource_type"];
  mid_price: number;
  bid_depth: number;
  ask_depth: number;
  tick: number;
  last_price: number | null;
};

export const buildQuote = (input: BuildQuoteInput): EconomyQuote => {
  const spread = Math.max(1, Math.floor(input.mid_price * 0.2));
  return {
    id: input.id,
    sector_id: input.sector_id,
    market_kind: input.market_kind,
    resource_type: input.resource_type,
    bid_price: Math.max(1, input.mid_price - spread),
    ask_price: input.mid_price + spread,
    spread,
    bid_depth: input.bid_depth,
    ask_depth: input.ask_depth,
    last_price: input.last_price ?? input.mid_price,
    price_tick: input.tick,
    expires_at_tick: input.tick + quote_ttl_ticks
  };
};
