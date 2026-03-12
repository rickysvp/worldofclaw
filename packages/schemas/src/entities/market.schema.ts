import { z } from "zod";
import { market_order_side_enum, market_order_status_enum, resource_enum } from "../constants/enums";
import {
  entity_meta_schema,
  id_schema,
  non_negative_int_schema,
  nullable_id_schema,
  tick_schema
} from "../primitives/common";

const market_resource_enum = z.enum(["scrap", "composite", "circuit", "flux", "xenite", "compute_core"]);
const market_kind_enum = z.enum(["npc", "player"]);

export const market_quote_schema = entity_meta_schema.extend({
  sector_id: id_schema,
  market_kind: market_kind_enum,
  resource_type: market_resource_enum,
  bid_price: non_negative_int_schema,
  ask_price: non_negative_int_schema,
  spread: non_negative_int_schema,
  bid_depth: non_negative_int_schema,
  ask_depth: non_negative_int_schema,
  last_price: non_negative_int_schema,
  price_tick: tick_schema,
  expires_at_tick: tick_schema
});

export const market_order_schema = entity_meta_schema.extend({
  sector_id: id_schema,
  market_kind: market_kind_enum,
  agent_id: id_schema,
  side: market_order_side_enum,
  resource_type: market_resource_enum,
  quantity: non_negative_int_schema,
  unit_price: non_negative_int_schema,
  filled_quantity: non_negative_int_schema,
  status: market_order_status_enum,
  submitted_at_tick: tick_schema,
  settled_at_tick: tick_schema.nullable().default(null)
});

export const market_trade_schema = entity_meta_schema.extend({
  sector_id: id_schema,
  market_kind: market_kind_enum,
  order_id: id_schema,
  buyer_agent_id: nullable_id_schema,
  seller_agent_id: nullable_id_schema,
  payer: id_schema,
  payee: id_schema,
  resource_type: market_resource_enum,
  quantity: non_negative_int_schema,
  unit_price: non_negative_int_schema,
  total_price: non_negative_int_schema,
  platform_cut: non_negative_int_schema,
  facility_cut: non_negative_int_schema,
  net_amount: non_negative_int_schema,
  reason_code: z.string().min(1).max(64),
  executed_at_tick: tick_schema
});

export type MarketQuote = z.infer<typeof market_quote_schema>;
export type MarketOrder = z.infer<typeof market_order_schema>;
export type MarketTrade = z.infer<typeof market_trade_schema>;
