import type { ResourceType, WorldState } from "../../../schemas/src";
import { addResourceDelta, createResourceBag, subtractResourceCost } from "../../../rules/src";
import { cloneState } from "../utils/clone-state";
import { getRemainingCargoCapacity, increaseCargoUsed } from "../utils/cargo";

export const transferSectorResourceToAgent = (
  world_state: WorldState,
  sector_id: string,
  agent_id: string,
  resource_type: Exclude<ResourceType, "credits">,
  amount: number
): { world_state: WorldState; transferred: number } => {
  const next = cloneState(world_state);
  const sector = next.registries.sectors[sector_id];
  const agent = next.registries.agents[agent_id];

  if (!sector || !agent || amount <= 0) {
    return { world_state: next, transferred: 0 };
  }

  const available = sector.resource_stock[resource_type];
  const remaining_capacity = getRemainingCargoCapacity(agent);
  const transferred = Math.min(available, amount, remaining_capacity);
  const sector_result = subtractResourceCost(createResourceBag(sector.resource_stock), { [resource_type]: transferred });
  const agent_result = addResourceDelta(createResourceBag(agent.inventory), { [resource_type]: transferred });
  sector.resource_stock = sector_result.bag;
  agent.inventory = agent_result.bag;
  increaseCargoUsed(agent, transferred);

  return { world_state: next, transferred };
};
