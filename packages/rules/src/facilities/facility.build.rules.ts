import type { FacilityType, Sector } from "../../../schemas/src";
import { facility_allowed_terrains, facility_build_cost_scrap } from "../map/map.constants";

export const getFacilityBuildCost = (facilityType: FacilityType): number => facility_build_cost_scrap[facilityType];

export const canBuildFacilityOnTerrain = (facilityType: FacilityType, terrainType: Sector["terrain_type"]): boolean =>
  facility_allowed_terrains[facilityType].includes(terrainType);
