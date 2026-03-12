import type { RiskPriceInput } from "../price.types";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const getRiskPriceModifierPct = (input: RiskPriceInput): number => {
  const danger_component = Math.floor(input.danger_level / 10) * 2;
  const route_component = input.route_level * -3;
  const signal_component = input.signal_modifier * -2;
  return clamp(100 + danger_component + route_component + signal_component, 85, 130);
};

export const applyRiskPrice = (base_price: number, input: RiskPriceInput): number =>
  Math.max(1, Math.floor((base_price * getRiskPriceModifierPct(input)) / 100));
