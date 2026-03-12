import type { TerrainType } from "../../schemas/src";

export type EconomicResource = "scrap" | "composite" | "circuit" | "flux" | "xenite" | "compute_core";
export type PriceSide = "buy" | "sell";
export type ServiceKind = "charge" | "repair" | "storage" | "relay" | "refinery";

export type BasePriceQuote = {
  resource_type: EconomicResource;
  buy_price: number;
  sell_price: number;
};

export type RegionalPriceInput = {
  terrain_type: TerrainType;
  resource_type?: EconomicResource;
  service_kind?: ServiceKind;
};

export type DynamicPriceInput = {
  previous_mid_price: number | null;
  base_mid_price: number;
  supply_signal: number;
  demand_signal: number;
};

export type RiskPriceInput = {
  danger_level: number;
  route_level: number;
  signal_modifier: number;
};
