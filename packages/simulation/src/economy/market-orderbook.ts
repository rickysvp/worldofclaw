import type { MarketQuote, WorldState } from "../../../schemas/src";
import {
  buildMarketOrder,
  buildMarketTrade,
  type EconomyOrder,
  type EconomyTrade,
  type MarketSide,
  type StructuredSettlement,
  updateQuoteAfterMatch
} from "../../../economy/src";
import { cloneState } from "../utils/clone-state";

export const getMarketQuoteForSector = (
  world_state: WorldState,
  sector_id: string,
  resource_type: MarketQuote["resource_type"],
  tick_number?: number,
  market_kind?: MarketQuote["market_kind"]
): MarketQuote | null =>
  Object.values(world_state.registries.market_quotes).find(
    (quote) =>
      quote.sector_id === sector_id &&
      quote.resource_type === resource_type &&
      (market_kind === undefined || quote.market_kind === market_kind) &&
      (tick_number === undefined || quote.expires_at_tick >= tick_number)
  ) ?? null;

export const executeMarketFill = (
  world_state: WorldState,
  input: {
    order: EconomyOrder;
    trade: EconomyTrade;
    side: MarketSide;
    quantity: number;
    unit_price: number;
    tick_number: number;
  }
): {
  world_state: WorldState;
  order: EconomyOrder;
  trade: EconomyTrade;
} => {
  const next = cloneState(world_state);
  next.registries.market_orders[input.order.id] = {
    ...input.order,
    version: 1,
    created_at_tick: input.tick_number,
    updated_at_tick: input.tick_number,
    status: "filled"
  };
  next.registries.market_trades[input.trade.id] = {
    ...input.trade,
    version: 1,
    created_at_tick: input.tick_number,
    updated_at_tick: input.tick_number
  };

  const quote = next.registries.market_quotes[`quote_${input.order.sector_id}_${input.order.resource_type}`];
  if (quote) {
    next.registries.market_quotes[quote.id] = {
      ...quote,
      ...updateQuoteAfterMatch(quote, input.side, input.quantity, input.unit_price, input.tick_number),
      updated_at_tick: input.tick_number
    };
  }

  return {
    world_state: next,
    order: next.registries.market_orders[input.order.id]!,
    trade: next.registries.market_trades[input.trade.id]!
  };
};

export const createOrderAndTrade = (input: {
  action_id: string;
  sector_id: string;
  market_kind: EconomyOrder["market_kind"];
  side: MarketSide;
  agent_id: string;
  resource_type: EconomyOrder["resource_type"];
  quantity: number;
  unit_price: number;
  tick_number: number;
  settlement: StructuredSettlement;
}): { order: EconomyOrder; trade: EconomyTrade } => {
  const order = buildMarketOrder({
    id: `order_${input.tick_number}_${input.action_id}`,
    sector_id: input.sector_id,
    market_kind: input.market_kind,
    agent_id: input.agent_id,
    side: input.side,
    resource_type: input.resource_type,
    quantity: input.quantity,
    unit_price: input.unit_price,
    tick: input.tick_number
  });

  const trade = buildMarketTrade({
    id: `trade_${input.tick_number}_${input.action_id}`,
    order_id: order.id,
    sector_id: input.sector_id,
    market_kind: input.market_kind,
    side: input.side,
    agent_id: input.agent_id,
    resource_type: input.resource_type,
    quantity: input.quantity,
    unit_price: input.unit_price,
    tick: input.tick_number,
    settlement: input.settlement
  });

  return { order, trade };
};
