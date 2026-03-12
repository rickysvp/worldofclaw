import type { Sector } from "../../../schemas/src";

const coordinateKey = (x: number, y: number): string => `${x},${y}`;

export const isWithinMapBounds = (x: number, y: number, mapWidth: number, mapHeight: number): boolean =>
  x >= 0 && x < mapWidth && y >= 0 && y < mapHeight;

export const buildCoordinateIndex = (sectors: Readonly<Record<string, Sector>>): Record<string, string> => {
  const index: Record<string, string> = {};

  for (const sector of Object.values(sectors)) {
    index[coordinateKey(sector.x, sector.y)] = sector.id;
  }

  return index;
};

export const getAdjacentCoordinateKeys = (x: number, y: number): string[] => [
  coordinateKey(x - 1, y),
  coordinateKey(x + 1, y),
  coordinateKey(x, y - 1),
  coordinateKey(x, y + 1)
];

export const buildOrthogonalAdjacencyIndex = (
  sectors: Readonly<Record<string, Sector>>,
  mapWidth: number,
  mapHeight: number
): Record<string, string[]> => {
  const coordinateIndex = buildCoordinateIndex(sectors);
  const adjacency: Record<string, string[]> = {};

  for (const sector of Object.values(sectors)) {
    adjacency[sector.id] = getAdjacentCoordinateKeys(sector.x, sector.y)
      .filter((coordinate) => {
        const [rawX, rawY] = coordinate.split(",");
        return isWithinMapBounds(Number(rawX), Number(rawY), mapWidth, mapHeight);
      })
      .map((coordinate) => coordinateIndex[coordinate])
      .filter((sectorId): sectorId is string => typeof sectorId === "string");
  }

  return adjacency;
};

export const areSectorsAdjacent = (
  adjacencyIndex: Readonly<Record<string, string[]>>,
  fromSectorId: string,
  toSectorId: string
): boolean => (adjacencyIndex[fromSectorId] ?? []).includes(toSectorId);
