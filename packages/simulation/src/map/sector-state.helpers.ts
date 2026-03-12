import type { Facility, Sector, WorldState } from "../../../schemas/src";
import { getDefaultSectorAccessPolicy, getSectorFacilitySlotCount } from "../../../rules/src";

export const synchronizeSectorOccupants = (worldState: WorldState): WorldState => {
  const next = structuredClone(worldState);

  for (const sector of Object.values(next.registries.sectors)) {
    sector.occupant_agent_ids = Object.values(next.registries.agents)
      .filter((agent) => agent.location === sector.id)
      .map((agent) => agent.id)
      .sort();
    sector.facility_ids = Object.values(next.registries.facilities)
      .filter((facility) => facility.sector_id === sector.id)
      .map((facility) => facility.id)
      .sort();
    sector.facility_slot_count = getSectorFacilitySlotCount(sector);
    if (sector.control_state !== "contested" && sector.access_policy === "open") {
      sector.access_policy = getDefaultSectorAccessPolicy(sector);
    }
  }

  return next;
};

export const getSectorFacilities = (worldState: WorldState, sectorId: string): Facility[] =>
  Object.values(worldState.registries.facilities).filter((facility) => facility.sector_id === sectorId);

export const getSectorOrThrow = (worldState: WorldState, sectorId: string): Sector => {
  const sector = worldState.registries.sectors[sectorId];
  if (!sector) {
    throw new Error(`sector ${sectorId} not found`);
  }
  return sector;
};
