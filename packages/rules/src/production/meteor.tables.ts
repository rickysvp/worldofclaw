import type { Sector } from "../../../schemas/src";

export const getMeteorResourcePick = (sector: Sector, preferred: "flux" | "xenite" | null, roll: number): "flux" | "xenite" => {
  if (sector.terrain_type !== "meteor_crater") {
    return "flux";
  }
  if (preferred) {
    return preferred;
  }
  return roll % 2 === 0 ? "flux" : "xenite";
};
