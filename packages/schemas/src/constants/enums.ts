import { z } from "zod";

export const resource_values = [
  "power",
  "scrap",
  "composite",
  "circuit",
  "flux",
  "xenite",
  "compute_core",
  "credits"
] as const;

export const terrain_values = [
  "safe_zone",
  "ruins",
  "wasteland_route",
  "meteor_crater",
  "industrial_remnant",
  "relay_highland"
] as const;

export const facility_values = [
  "generator",
  "refinery",
  "workshop",
  "shelter",
  "storage",
  "relay",
  "defense_node"
] as const;

export const action_values = [
  "move",
  "scan",
  "salvage",
  "mine_meteor",
  "trade",
  "charge",
  "repair",
  "craft",
  "refine",
  "escort",
  "attack",
  "build",
  "claim"
] as const;

export const agent_status_values = [
  "idle",
  "moving",
  "operating",
  "charging",
  "repairing",
  "escorting",
  "attacking",
  "stopped",
  "wrecked",
  "offline",
  "disabled"
] as const;

export const facility_status_values = [
  "online",
  "offline",
  "damaged",
  "building",
  "depleted",
  "disabled"
] as const;

export const sector_access_policy_values = [
  "open",
  "restricted",
  "members_only"
] as const;

export const facility_access_policy_values = [
  "public",
  "restricted",
  "members_only",
  "owner_only"
] as const;

export const sector_control_state_values = [
  "uncontrolled",
  "controlled",
  "contested"
] as const;

export const contract_kind_values = [
  "skill_install",
  "resource_claim",
  "facility_access",
  "escort_assignment",
  "trade_order"
] as const;

export const contract_status_values = [
  "draft",
  "active",
  "fulfilled",
  "expired",
  "cancelled",
  "breached"
] as const;

export const event_kind_values = [
  "system",
  "world",
  "agent",
  "facility",
  "contract",
  "skill",
  "security"
] as const;

export const event_level_values = [
  "info",
  "warn",
  "error",
  "critical"
] as const;

export const ledger_entry_kind_values = [
  "resource_delta",
  "credits_delta",
  "inventory_snapshot",
  "registry_change"
] as const;

export const tick_phase_values = [
  "environment",
  "resource_refresh",
  "agent_upkeep",
  "action_resolution",
  "relation",
  "event_emission"
] as const;

export const action_status_values = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled"
] as const;

export const action_error_code_values = [
  "ACTION_INVALID_PAYLOAD",
  "ACTION_AGENT_NOT_FOUND",
  "ACTION_AGENT_UNAVAILABLE",
  "ACTION_INSUFFICIENT_POWER",
  "ACTION_INSUFFICIENT_RESOURCES",
  "ACTION_TARGET_NOT_FOUND",
  "ACTION_ACCESS_DENIED",
  "ACTION_INVALID_LOCATION",
  "ACTION_SLOT_OCCUPIED",
  "ACTION_ALREADY_RUNNING",
  "ACTION_TARGET_EXPIRED",
  "ACTION_WORLD_PAUSED"
] as const;

export const action_result_code_values = [
  "action_applied",
  "invalid_action_payload",
  "agent_unavailable",
  "insufficient_power",
  "target_missing",
  "target_unavailable",
  "sector_not_adjacent",
  "terrain_mismatch",
  "facility_unavailable",
  "market_unavailable",
  "price_out_of_range",
  "insufficient_resources",
  "insufficient_credits",
  "insufficient_cargo_capacity",
  "resource_depleted",
  "claim_exists",
  "build_limit_reached",
  "access_denied",
  "invalid_location",
  "slot_occupied",
  "unsupported_action"
] as const;

export const market_order_side_values = ["buy", "sell"] as const;
export const market_order_status_values = ["open", "filled", "cancelled", "expired"] as const;

export const resource_enum = z.enum(resource_values);
export const terrain_enum = z.enum(terrain_values);
export const facility_enum = z.enum(facility_values);
export const action_enum = z.enum(action_values);
export const agent_status_enum = z.enum(agent_status_values);
export const facility_status_enum = z.enum(facility_status_values);
export const sector_access_policy_enum = z.enum(sector_access_policy_values);
export const facility_access_policy_enum = z.enum(facility_access_policy_values);
export const sector_control_state_enum = z.enum(sector_control_state_values);
export const contract_kind_enum = z.enum(contract_kind_values);
export const contract_status_enum = z.enum(contract_status_values);
export const event_kind_enum = z.enum(event_kind_values);
export const event_level_enum = z.enum(event_level_values);
export const ledger_entry_kind_enum = z.enum(ledger_entry_kind_values);
export const tick_phase_enum = z.enum(tick_phase_values);
export const action_result_code_enum = z.enum(action_result_code_values);
export const action_status_enum = z.enum(action_status_values);
export const action_error_code_enum = z.enum(action_error_code_values);
export const market_order_side_enum = z.enum(market_order_side_values);
export const market_order_status_enum = z.enum(market_order_status_values);

export type ResourceType = z.infer<typeof resource_enum>;
export type TerrainType = z.infer<typeof terrain_enum>;
export type FacilityType = z.infer<typeof facility_enum>;
export type ActionType = z.infer<typeof action_enum>;
export type AgentStatus = z.infer<typeof agent_status_enum>;
export type FacilityStatus = z.infer<typeof facility_status_enum>;
export type SectorAccessPolicy = z.infer<typeof sector_access_policy_enum>;
export type FacilityAccessPolicy = z.infer<typeof facility_access_policy_enum>;
export type SectorControlState = z.infer<typeof sector_control_state_enum>;
export type ContractKind = z.infer<typeof contract_kind_enum>;
export type ContractStatus = z.infer<typeof contract_status_enum>;
export type EventKind = z.infer<typeof event_kind_enum>;
export type EventLevel = z.infer<typeof event_level_enum>;
export type LedgerEntryKind = z.infer<typeof ledger_entry_kind_enum>;
export type TickPhaseName = z.infer<typeof tick_phase_enum>;
export type ActionStatus = z.infer<typeof action_status_enum>;
export type ActionErrorCode = z.infer<typeof action_error_code_enum>;
export type ActionResultCode = z.infer<typeof action_result_code_enum>;
export type MarketOrderSide = z.infer<typeof market_order_side_enum>;
export type MarketOrderStatus = z.infer<typeof market_order_status_enum>;
