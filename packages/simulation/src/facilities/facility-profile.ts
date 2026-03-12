import type { FacilityType } from "../../../schemas/src";

export type FacilityProfile = {
  coverage_radius: number;
  uses_linked_sectors: boolean;
};

const facility_profiles: Record<FacilityType, FacilityProfile> = {
  generator: {
    coverage_radius: 0,
    uses_linked_sectors: true
  },
  refinery: {
    coverage_radius: 0,
    uses_linked_sectors: false
  },
  workshop: {
    coverage_radius: 0,
    uses_linked_sectors: false
  },
  shelter: {
    coverage_radius: 1,
    uses_linked_sectors: true
  },
  storage: {
    coverage_radius: 0,
    uses_linked_sectors: true
  },
  relay: {
    coverage_radius: 1,
    uses_linked_sectors: true
  },
  defense_node: {
    coverage_radius: 1,
    uses_linked_sectors: true
  }
};

export const getFacilityProfile = (facility_type: FacilityType): FacilityProfile => facility_profiles[facility_type];
