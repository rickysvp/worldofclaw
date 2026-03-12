import type { Sector } from "../../../schemas/src";

export const getSalvageYield = (sector: Sector, roll: number): number => {
  const base = sector.terrain_type === "ruins" ? 2 : sector.terrain_type === "industrial_remnant" ? 3 : 1;
  return Math.max(1, Math.min(4, base + Math.max(0, roll)));
};
