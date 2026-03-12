import type { WorldState } from "../../../schemas/src";
import { areSectorsAdjacent, buildOrthogonalAdjacencyIndex } from "../../../rules/src";

type SectorRegistry = WorldState["registries"]["sectors"];

export const buildNeighborSectorIndex = (sectors: SectorRegistry): Record<string, string[]> => {
  const max_x = Math.max(...Object.values(sectors).map((sector) => sector.x));
  const max_y = Math.max(...Object.values(sectors).map((sector) => sector.y));
  return buildOrthogonalAdjacencyIndex(sectors, max_x + 1, max_y + 1);
};

export const getAdjacentSectorIds = (world_state: WorldState, sector_id: string): string[] => {
  const indexed_neighbors = world_state.indexes.neighbor_sector_ids[sector_id];
  if (indexed_neighbors) {
    return indexed_neighbors;
  }

  return buildNeighborSectorIndex(world_state.registries.sectors)[sector_id] ?? [];
};

export const isSectorAdjacent = (world_state: WorldState, from_sector_id: string, to_sector_id: string): boolean =>
  areSectorsAdjacent(
    Object.keys(world_state.indexes.neighbor_sector_ids).length > 0
      ? world_state.indexes.neighbor_sector_ids
      : buildNeighborSectorIndex(world_state.registries.sectors),
    from_sector_id,
    to_sector_id
  );
