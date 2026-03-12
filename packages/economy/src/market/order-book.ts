import type { EconomyOrder, EconomyQuote, EconomyTrade, MarketSide } from "../market.types";
import type { StructuredSettlement } from "../settlement.types";

export type BuildOrderInput = {
  id: string;
  sector_id: string;
  market_kind: EconomyOrder["market_kind"];
  agent_id: string;
  side: MarketSide;
  resource_type: EconomyOrder["resource_type"];
  quantity: number;
  unit_price: number;
  tick: number;
};

export const buildMarketOrder = (input: BuildOrderInput): EconomyOrder => ({
  id: input.id,
  sector_id: input.sector_id,
  market_kind: input.market_kind,
  agent_id: input.agent_id,
  side: input.side,
  resource_type: input.resource_type,
  quantity: input.quantity,
  unit_price: input.unit_price,
  filled_quantity: input.quantity,
  submitted_at_tick: input.tick,
  settled_at_tick: input.tick
});

export type BuildTradeInput = {
  id: string;
  order_id: string;
  sector_id: string;
  market_kind: EconomyTrade["market_kind"];
  side: MarketSide;
  agent_id: string;
  resource_type: EconomyTrade["resource_type"];
  quantity: number;
  unit_price: number;
  tick: number;
  settlement: StructuredSettlement;
};

export const buildMarketTrade = (input: BuildTradeInput): EconomyTrade => ({
  id: input.id,
  sector_id: input.sector_id,
  market_kind: input.market_kind,
  order_id: input.order_id,
  buyer_agent_id: input.side === "buy" ? input.agent_id : null,
  seller_agent_id: input.side === "sell" ? input.agent_id : null,
  payer: input.settlement.payer,
  payee: input.settlement.payee,
  resource_type: input.resource_type,
  quantity: input.quantity,
  unit_price: input.unit_price,
  total_price: input.quantity * input.unit_price,
  platform_cut: input.settlement.platform_cut,
  facility_cut: input.settlement.facility_cut,
  net_amount: input.settlement.net_amount,
  reason_code: input.settlement.reason_code,
  executed_at_tick: input.tick
});

export const updateQuoteAfterMatch = (quote: EconomyQuote, side: MarketSide, quantity: number, unit_price: number, tick: number): EconomyQuote => ({
  ...quote,
  bid_depth: side === "sell" ? Math.max(0, quote.bid_depth - quantity) : quote.bid_depth,
  ask_depth: side === "buy" ? Math.max(0, quote.ask_depth - quantity) : quote.ask_depth,
  last_price: unit_price,
  price_tick: tick,
  expires_at_tick: Math.max(quote.expires_at_tick, tick + 1)
});
