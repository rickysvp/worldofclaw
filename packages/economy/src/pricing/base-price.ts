import { npc_anchor_prices } from "../constants";
import type { BasePriceQuote, EconomicResource } from "../price.types";

export const getBasePriceQuote = (resource_type: EconomicResource): BasePriceQuote => ({
  resource_type,
  buy_price: npc_anchor_prices[resource_type].buy,
  sell_price: npc_anchor_prices[resource_type].sell
});

export const getBaseMidPrice = (resource_type: EconomicResource): number => {
  const quote = getBasePriceQuote(resource_type);
  return Math.max(1, Math.floor((quote.buy_price + quote.sell_price) / 2));
};
