import type { EconomicResource } from "./price.types";

export type MarketKind = "npc" | "player";
export type MarketSide = "buy" | "sell";

export type EconomyQuote = {
  id: string;
  sector_id: string;
  market_kind: MarketKind;
  resource_type: EconomicResource;
  bid_price: number;
  ask_price: number;
  spread: number;
  bid_depth: number;
  ask_depth: number;
  last_price: number;
  price_tick: number;
  expires_at_tick: number;
};

export type TradeMatchResult = {
  ok: boolean;
  failure_code: "market_unavailable" | "price_out_of_range" | "insufficient_credits" | "insufficient_resources" | "insufficient_cargo_capacity" | null;
  side: MarketSide;
  executed_quantity: number;
  executed_unit_price: number;
  gross_amount: number;
};

export type EconomyOrder = {
  id: string;
  sector_id: string;
  market_kind: MarketKind;
  agent_id: string;
  side: MarketSide;
  resource_type: EconomicResource;
  quantity: number;
  unit_price: number;
  filled_quantity: number;
  submitted_at_tick: number;
  settled_at_tick: number | null;
};

export type EconomyTrade = {
  id: string;
  sector_id: string;
  market_kind: MarketKind;
  order_id: string;
  buyer_agent_id: string | null;
  seller_agent_id: string | null;
  payer: string;
  payee: string;
  resource_type: EconomicResource;
  quantity: number;
  unit_price: number;
  total_price: number;
  platform_cut: number;
  facility_cut: number;
  net_amount: number;
  reason_code: string;
  executed_at_tick: number;
};
