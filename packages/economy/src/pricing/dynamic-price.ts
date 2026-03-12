import { max_tick_price_delta_bps, scarcity_max_multiplier, scarcity_min_multiplier } from "../constants";
import type { DynamicPriceInput } from "../price.types";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getScarcityMultiplier = (input: DynamicPriceInput): number => {
  const supply = Math.max(1, input.supply_signal);
  const demand = Math.max(1, input.demand_signal);
  const ratio = demand / supply;
  return clamp(Number(ratio.toFixed(2)), scarcity_min_multiplier, scarcity_max_multiplier);
};

export const clampTickPriceDelta = (previous_mid_price: number | null, target_mid_price: number): number => {
  if (previous_mid_price === null) {
    return Math.max(1, target_mid_price);
  }

  const max_delta = Math.max(1, Math.floor((previous_mid_price * max_tick_price_delta_bps) / 10_000));
  const min_price = Math.max(1, previous_mid_price - max_delta);
  const max_price = previous_mid_price + max_delta;
  return clamp(target_mid_price, min_price, max_price);
};

export const applyDynamicPrice = (input: DynamicPriceInput): number => {
  const scarcity_multiplier = getScarcityMultiplier(input);
  const target = Math.max(1, Math.floor(input.base_mid_price * scarcity_multiplier));
  return clampTickPriceDelta(input.previous_mid_price, target);
};
