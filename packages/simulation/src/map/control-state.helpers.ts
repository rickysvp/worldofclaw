import type { Facility, Sector, WorldEvent, WorldState } from "../../../schemas/src";
import { deriveSectorControlSummary } from "../../../rules/src";

export const getSectorEvents = (worldState: WorldState, sectorId: string): WorldEvent[] =>
  Object.values(worldState.registries.events).filter((event) => event.sector_id === sectorId);

export const deriveControlForSector = (
  worldState: WorldState,
  sector: Sector,
  facilities: readonly Facility[],
  tickNumber: number
) => deriveSectorControlSummary(sector, facilities, getSectorEvents(worldState, sector.id), tickNumber);
