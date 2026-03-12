import type { FacilityType, TerrainType } from "../../../schemas/src";

export const MAX_FACILITY_SLOTS = 3;
export const CONTROL_HOLD_TICKS = 12;
export const CONTESTED_LOOKBACK_TICKS = 6;
export const CONTESTED_HOSTILE_THRESHOLD = 3;

export const terrain_default_slots: Record<TerrainType, number> = {
  safe_zone: 3,
  ruins: 2,
  wasteland_route: 1,
  meteor_crater: 1,
  industrial_remnant: 2,
  relay_highland: 2
};

export const facility_allowed_terrains: Record<FacilityType, TerrainType[]> = {
  generator: ["safe_zone", "industrial_remnant", "wasteland_route"],
  refinery: ["industrial_remnant", "safe_zone"],
  workshop: ["safe_zone", "industrial_remnant", "ruins"],
  shelter: ["safe_zone", "wasteland_route", "ruins"],
  storage: ["safe_zone", "industrial_remnant", "wasteland_route"],
  relay: ["relay_highland", "safe_zone", "industrial_remnant"],
  defense_node: ["safe_zone", "wasteland_route", "relay_highland", "industrial_remnant"]
};

export const facility_build_cost_scrap: Record<FacilityType, number> = {
  generator: 4,
  refinery: 5,
  workshop: 4,
  shelter: 3,
  storage: 3,
  relay: 5,
  defense_node: 4
};

export const relay_visibility_bonus_by_level = 1;
