import type { WorldState } from "../../../schemas/src";

export const findShortestRoute = (worldState: WorldState, fromSectorId: string, toSectorId: string): string[] => {
  if (fromSectorId === toSectorId) {
    return [fromSectorId];
  }

  const queue: Array<{ sector_id: string; path: string[] }> = [{ sector_id: fromSectorId, path: [fromSectorId] }];
  const visited = new Set<string>([fromSectorId]);

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) {
      break;
    }

    for (const neighborId of worldState.indexes.neighbor_sector_ids[current.sector_id] ?? []) {
      if (visited.has(neighborId)) {
        continue;
      }

      const nextPath = [...current.path, neighborId];
      if (neighborId === toSectorId) {
        return nextPath;
      }

      visited.add(neighborId);
      queue.push({ sector_id: neighborId, path: nextPath });
    }
  }

  return [];
};
