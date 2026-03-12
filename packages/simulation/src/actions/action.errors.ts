import type { ActionErrorCode, ActionResultCode } from "../../../schemas/src";

const result_to_error_map: Record<ActionResultCode, ActionErrorCode | null> = {
  action_applied: null,
  invalid_action_payload: "ACTION_INVALID_PAYLOAD",
  agent_unavailable: "ACTION_AGENT_UNAVAILABLE",
  insufficient_power: "ACTION_INSUFFICIENT_POWER",
  target_missing: "ACTION_TARGET_NOT_FOUND",
  target_unavailable: "ACTION_TARGET_NOT_FOUND",
  sector_not_adjacent: "ACTION_INVALID_LOCATION",
  terrain_mismatch: "ACTION_INVALID_LOCATION",
  facility_unavailable: "ACTION_TARGET_NOT_FOUND",
  market_unavailable: "ACTION_TARGET_NOT_FOUND",
  price_out_of_range: "ACTION_INVALID_PAYLOAD",
  insufficient_resources: "ACTION_INSUFFICIENT_RESOURCES",
  insufficient_credits: "ACTION_INSUFFICIENT_RESOURCES",
  insufficient_cargo_capacity: "ACTION_INSUFFICIENT_RESOURCES",
  resource_depleted: "ACTION_INSUFFICIENT_RESOURCES",
  claim_exists: "ACTION_TARGET_EXPIRED",
  build_limit_reached: "ACTION_SLOT_OCCUPIED",
  access_denied: "ACTION_ACCESS_DENIED",
  invalid_location: "ACTION_INVALID_LOCATION",
  slot_occupied: "ACTION_SLOT_OCCUPIED",
  unsupported_action: "ACTION_INVALID_PAYLOAD"
};

export const mapResultCodeToErrorCode = (result_code: ActionResultCode): ActionErrorCode | null =>
  result_to_error_map[result_code] ?? "ACTION_INVALID_PAYLOAD";
