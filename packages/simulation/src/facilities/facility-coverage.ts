import type { Facility, FacilityType, WorldState } from "../../../schemas/src";
import { getFacilityProfile } from "./facility-profile";
import { getAdjacentSectorIds } from "../map/sector-graph";

const expandCoverage = (world_state: WorldState, origin_sector_id: string, radius: number): string[] => {
  const visited = new Set<string>([origin_sector_id]);
  let frontier = [origin_sector_id];

  for (let step = 0; step < radius; step += 1) {
    const next_frontier = new Set<string>();
    for (const sector_id of frontier) {
      for (const neighbor_id of getAdjacentSectorIds(world_state, sector_id)) {
        if (!visited.has(neighbor_id)) {
          visited.add(neighbor_id);
          next_frontier.add(neighbor_id);
        }
      }
    }
    frontier = [...next_frontier];
  }

  return [...visited];
};

const getFacilityCoverage = (world_state: WorldState, facility: Facility): string[] => {
  const profile = getFacilityProfile(facility.facility_type);
  const covered = new Set<string>(expandCoverage(world_state, facility.sector_id, profile.coverage_radius));

  if (profile.uses_linked_sectors) {
    for (const linked_sector_id of facility.linked_sector_ids) {
      covered.add(linked_sector_id);
    }
  }

  return [...covered];
};

export const buildFacilityCoverageIndex = (world_state: WorldState): Record<string, string[]> => {
  const coverage_index: Record<string, string[]> = {};

  for (const facility of Object.values(world_state.registries.facilities) as Facility[]) {
    if (facility.status !== "online") {
      continue;
    }

    for (const sector_id of getFacilityCoverage(world_state, facility)) {
      coverage_index[sector_id] = [...(coverage_index[sector_id] ?? []), facility.id];
    }
  }

  return coverage_index;
};

export const getFacilitiesCoveringSector = (world_state: WorldState, sector_id: string): Facility[] => {
  const coverage_index =
    Object.keys(world_state.indexes.facility_coverage_by_sector_id).length > 0
      ? world_state.indexes.facility_coverage_by_sector_id
      : buildFacilityCoverageIndex(world_state);

  return (coverage_index[sector_id] ?? [])
    .map((facility_id) => world_state.registries.facilities[facility_id])
    .filter((facility): facility is Facility => typeof facility !== "undefined");
};

export const sectorHasOnlineFacilityType = (
  world_state: WorldState,
  sector_id: string,
  facility_type: FacilityType
): boolean => getFacilitiesCoveringSector(world_state, sector_id).some((facility) => facility.facility_type === facility_type);
