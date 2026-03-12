import type { Sector, WorldState } from "../../../schemas/src";
import { addResourceDelta, createResourceBag, getSectorResourceCapRule, resource_keys } from "../../../rules/src";
import { cloneState } from "../utils/clone-state";

export const refreshSectorResources = (world_state: WorldState): WorldState => {
  const next = cloneState(world_state);

  for (const sector of Object.values(next.registries.sectors) as Sector[]) {
    const caps = getSectorResourceCapRule(sector);
    const regen_delta = createResourceBag(
      Object.fromEntries(resource_keys.map((resource_key) => [resource_key, Math.max(0, sector.resource_regen[resource_key])]))
    );
    const result = addResourceDelta(createResourceBag(sector.resource_stock), regen_delta, caps);
    sector.resource_stock = result.bag;
  }

  return next;
};

export const countRefreshedResourceSectors = (world_state: WorldState): number =>
  (Object.values(world_state.registries.sectors) as Sector[]).filter(
    (sector) =>
      sector.resource_regen.power > 0 ||
      sector.resource_regen.scrap > 0 ||
      sector.resource_regen.flux > 0 ||
      sector.resource_regen.xenite > 0 ||
      sector.resource_regen.compute_core > 0
  ).length;
