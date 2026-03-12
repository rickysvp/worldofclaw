import type { Inventory, Sector } from "../../schemas/src";
import { starter_resource_defaults, starter_strategy_defaults } from "./constants";
import type { StarterStrategy } from "./onboarding.types";

export const createStarterResources = (): Inventory => ({ ...starter_resource_defaults });

export const createStarterStrategy = (): StarterStrategy => ({ ...starter_strategy_defaults });

export const assignStarterSpawn = (sectors: ReadonlyArray<Sector>): string | null => {
  const safe_zone = [...sectors]
    .filter((sector) => sector.terrain_type === "safe_zone" && !sector.blocked)
    .sort((left, right) => left.id.localeCompare(right.id))[0];

  return safe_zone?.id ?? null;
};
