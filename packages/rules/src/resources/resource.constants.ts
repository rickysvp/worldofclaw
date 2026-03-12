import type { ResourceType, Sector } from "../../../schemas/src";

export const resource_keys = [
  "power",
  "scrap",
  "composite",
  "circuit",
  "flux",
  "xenite",
  "compute_core",
  "credits"
] as const satisfies readonly ResourceType[];

export const resource_default_values: Record<ResourceType, number> = {
  power: 0,
  scrap: 0,
  composite: 0,
  circuit: 0,
  flux: 0,
  xenite: 0,
  compute_core: 0,
  credits: 0
};

export const resource_max_values: Record<ResourceType, number> = {
  power: 1_000_000,
  scrap: 1_000_000,
  composite: 1_000_000,
  circuit: 1_000_000,
  flux: 1_000_000,
  xenite: 1_000_000,
  compute_core: 1_000_000,
  credits: 1_000_000_000
};

export const resource_error_codes = {
  NONNEGATIVE_VIOLATION: "RESOURCE_NONNEGATIVE_VIOLATION",
  CAPACITY_EXCEEDED: "RESOURCE_CAPACITY_EXCEEDED",
  INVALID_RESOURCE_TYPE: "RESOURCE_INVALID_TYPE",
  INSUFFICIENT_RESOURCE: "RESOURCE_INSUFFICIENT",
  INVALID_DELTA: "RESOURCE_INVALID_DELTA"
} as const;

export const getSectorResourceCapRule = (sector: Pick<Sector, "terrain_type">): Record<ResourceType, number> => ({
  power: sector.terrain_type === "safe_zone" ? 20 : 10,
  scrap: sector.terrain_type === "industrial_remnant" ? 30 : sector.terrain_type === "ruins" ? 25 : 12,
  composite: sector.terrain_type === "industrial_remnant" ? 10 : 4,
  circuit: sector.terrain_type === "relay_highland" ? 10 : 3,
  flux: sector.terrain_type === "meteor_crater" ? 12 : 2,
  xenite: sector.terrain_type === "meteor_crater" ? 8 : 1,
  compute_core: sector.terrain_type === "relay_highland" ? 6 : 1,
  credits: 0
});
