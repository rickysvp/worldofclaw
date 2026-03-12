import type { Facility, FacilityType } from "../../../schemas/src";

const getDefaultPowerCapacity = (facility_type: FacilityType): number => {
  switch (facility_type) {
    case "generator":
      return 20;
    case "refinery":
      return 10;
    case "workshop":
      return 10;
    case "shelter":
      return 5;
    case "storage":
      return 5;
    case "relay":
      return 8;
    case "defense_node":
      return 8;
    default:
      return 5;
  }
};

const getDefaultStorageCapacity = (facility_type: FacilityType): number => {
  switch (facility_type) {
    case "storage":
      return 30;
    case "generator":
      return 10;
    case "refinery":
      return 20;
    case "workshop":
      return 20;
    case "shelter":
      return 10;
    case "relay":
      return 10;
    case "defense_node":
      return 10;
    default:
      return 10;
  }
};

export const createFacilityFromBuild = (
  facility_id: string,
  facility_type: FacilityType,
  sector_id: string,
  owner_user_id: string | null,
  operator_agent_id: string,
  tick_number: number
): Facility => ({
  id: facility_id,
  version: 1,
  created_at_tick: tick_number,
  updated_at_tick: tick_number,
  owner_user_id,
  owner_agent_id: operator_agent_id,
  operator_agent_id,
  sector_id,
  facility_type,
  status: "online",
  access_policy: facility_type === "generator" || facility_type === "shelter" ? "public" : "restricted",
  public_use: facility_type === "generator" || facility_type === "shelter",
  level: 1,
  durability: 20,
  durability_max: 20,
  disabled_at_tick: null,
  claimed_at_tick: tick_number,
  power_buffer: 0,
  power_capacity: getDefaultPowerCapacity(facility_type),
  storage_capacity: getDefaultStorageCapacity(facility_type),
  inventory: {
    power: 0,
    scrap: 0,
    composite: 0,
    circuit: 0,
    flux: 0,
    xenite: 0,
    compute_core: 0,
    credits: 0
  },
  linked_sector_ids: []
});
