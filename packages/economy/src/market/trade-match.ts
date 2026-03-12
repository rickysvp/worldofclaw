import type { EconomyQuote, MarketSide, TradeMatchResult } from "../market.types";

export type MatchTradeInput = {
  quote: EconomyQuote;
  side: MarketSide;
  requested_quantity: number;
  offered_unit_price: number;
  available_credits: number;
  available_inventory: number;
  available_cargo_capacity: number;
};

export const matchTradeAgainstQuote = (input: MatchTradeInput): TradeMatchResult => {
  const market_unit_price = input.side === "buy" ? input.quote.ask_price : input.quote.bid_price;
  if (input.side === "buy" && input.offered_unit_price < market_unit_price) {
    return { ok: false, failure_code: "price_out_of_range", side: input.side, executed_quantity: 0, executed_unit_price: market_unit_price, gross_amount: 0 };
  }
  if (input.side === "sell" && input.offered_unit_price > market_unit_price) {
    return { ok: false, failure_code: "price_out_of_range", side: input.side, executed_quantity: 0, executed_unit_price: market_unit_price, gross_amount: 0 };
  }

  if (input.side === "buy") {
    const affordable_quantity = Math.floor(input.available_credits / market_unit_price);
    const executed_quantity = Math.min(input.requested_quantity, input.quote.ask_depth, input.available_cargo_capacity, affordable_quantity);
    if (executed_quantity <= 0) {
      const failure_code = affordable_quantity <= 0 ? "insufficient_credits" : input.available_cargo_capacity <= 0 ? "insufficient_cargo_capacity" : "market_unavailable";
      return { ok: false, failure_code, side: input.side, executed_quantity: 0, executed_unit_price: market_unit_price, gross_amount: 0 };
    }
    return {
      ok: true,
      failure_code: null,
      side: input.side,
      executed_quantity,
      executed_unit_price: market_unit_price,
      gross_amount: executed_quantity * market_unit_price
    };
  }

  const executed_quantity = Math.min(input.requested_quantity, input.quote.bid_depth, input.available_inventory);
  if (executed_quantity <= 0) {
    return { ok: false, failure_code: "insufficient_resources", side: input.side, executed_quantity: 0, executed_unit_price: market_unit_price, gross_amount: 0 };
  }
  return {
    ok: true,
    failure_code: null,
    side: input.side,
    executed_quantity,
    executed_unit_price: market_unit_price,
    gross_amount: executed_quantity * market_unit_price
  };
};
