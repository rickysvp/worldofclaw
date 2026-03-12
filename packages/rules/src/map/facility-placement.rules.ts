import type { Facility, FacilityType, Sector } from "../../../schemas/src";
import { facility_allowed_terrains } from "./map.constants";
import { hasAvailableFacilitySlot, isSectorBlocked } from "./sector.rules";

export type FacilityPlacementCheck = {
  allowed: boolean;
  error_code: "invalid_location" | "slot_occupied" | "access_denied" | null;
};

export const canPlaceFacilityInSector = (
  sector: Sector,
  facilities: readonly Facility[],
  facilityType: FacilityType,
  hasAccess: boolean
): FacilityPlacementCheck => {
  if (isSectorBlocked(sector)) {
    return { allowed: false, error_code: "invalid_location" };
  }

  if (!facility_allowed_terrains[facilityType].includes(sector.terrain_type)) {
    return { allowed: false, error_code: "invalid_location" };
  }

  if (!hasAccess) {
    return { allowed: false, error_code: "access_denied" };
  }

  const occupiedFacilityIds = facilities.length > 0 ? facilities.map((facility) => facility.id) : sector.facility_ids;
  if (!hasAvailableFacilitySlot({ ...sector, facility_ids: occupiedFacilityIds })) {
    return { allowed: false, error_code: "slot_occupied" };
  }

  return { allowed: true, error_code: null };
};
