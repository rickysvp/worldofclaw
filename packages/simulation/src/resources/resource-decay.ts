import type { Agent, Facility, WorldState } from "../../../schemas/src";
import { applyAgentPassiveDecay, applyFacilityPassiveDecay } from "../../../rules/src";
import { cloneState } from "../utils/clone-state";

export const decayAgentResources = (agent: Agent): Agent => {
  return applyAgentPassiveDecay(agent, {
    is_day: true,
    has_shelter: true,
    tick_number: agent.updated_at_tick
  });
};

export const decayFacilityResources = (facility: Facility): Facility => {
  return applyFacilityPassiveDecay(facility, facility.updated_at_tick);
};

export const applyWorldResourceDecay = (world_state: WorldState): WorldState => {
  const next = cloneState(world_state);

  for (const agent_id of Object.keys(next.registries.agents)) {
    const agent = next.registries.agents[agent_id];
    if (agent) {
      next.registries.agents[agent_id] = decayAgentResources(agent);
    }
  }

  for (const facility_id of Object.keys(next.registries.facilities)) {
    const facility = next.registries.facilities[facility_id];
    if (facility) {
      next.registries.facilities[facility_id] = decayFacilityResources(facility);
    }
  }

  return next;
};
