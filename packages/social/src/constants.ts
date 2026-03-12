export const trust_min = -100 as const;
export const trust_max = 100 as const;
export const hostility_min = 0 as const;
export const hostility_max = 100 as const;
export const bond_min = 0 as const;
export const bond_max = 100 as const;
export const debt_min = 0 as const;
export const fame_min = 0 as const;
export const fame_max = 100 as const;

export const successful_trade_trust_gain = 2 as const;
export const successful_trade_streak_threshold = 3 as const;
export const successful_trade_streak_bonus = 5 as const;
export const shared_facility_bond_gain = 1 as const;
export const mutual_defense_bond_gain = 3 as const;
export const aided_stopped_agent_trust_gain = 8 as const;
export const attack_hostility_gain = 15 as const;
export const attack_critical_hostility_gain = 20 as const;
export const contract_breach_trust_penalty = 15 as const;
export const contract_breach_hostility_gain = 5 as const;
export const public_facility_repair_fame_min = 5 as const;
export const public_facility_repair_fame_max = 15 as const;

export const supply_network_trade_threshold = 4 as const;
export const supply_network_shared_facility_threshold = 3 as const;
export const supply_network_mutual_defense_threshold = 2 as const;
export const supply_network_window_ticks = 12 as const;

export const outpost_min_active_agents = 3 as const;
export const outpost_control_hold_ticks = 12 as const;
export const outpost_min_average_bond = 20 as const;
export const outpost_required_facilities = ["shelter"] as const;
export const outpost_optional_power_facilities = ["generator", "storage"] as const;

export const faction_min_members = 5 as const;
export const faction_income_window_ticks = 24 as const;
export const faction_min_average_trust = 30 as const;
export const faction_required_distinct_facility_types = 2 as const;

export const organization_types = ["supply_network", "outpost", "faction"] as const;
export const organization_roles = ["founder", "maintainer", "trader", "member", "guest"] as const;

export const split_risk_warn_threshold = 60 as const;
export const split_risk_break_threshold = 80 as const;
export const dissolve_health_threshold = 20 as const;

export const default_tax_rate_bps = 500 as const;
export const default_service_fee_bps = 300 as const;
export const default_treasury_split_bps = 2000 as const;
