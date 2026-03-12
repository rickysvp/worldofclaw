export const platform_treasury_entity_id = "platform_treasury" as const;
export const npc_market_entity_prefix = "npc_market" as const;
export const npc_market_starting_credits = 100_000 as const;

export const quote_ttl_ticks = 2 as const;
export const scarcity_min_multiplier = 0.7 as const;
export const scarcity_max_multiplier = 1.8 as const;
export const max_tick_price_delta_bps = 1500 as const;

export const player_trade_platform_fee_bps = 300 as const;
export const player_trade_owner_fee_bps_min = 100 as const;
export const player_trade_owner_fee_bps_default = 200 as const;
export const player_facility_service_platform_bps = 2000 as const;
export const player_facility_service_owner_bps = 8000 as const;
export const platform_infrastructure_service_bps = 10000 as const;

export const npc_anchor_prices = {
  scrap: { buy: 4, sell: 6 },
  composite: { buy: 6, sell: 9 },
  circuit: { buy: 10, sell: 14 },
  flux: { buy: 18, sell: 24 },
  xenite: { buy: 20, sell: 28 },
  compute_core: { buy: 40, sell: 60 }
} as const;

export const service_base_prices = {
  charge: 1,
  repair: 2,
  storage: 1,
  relay: 4,
  refinery: 5
} as const;
