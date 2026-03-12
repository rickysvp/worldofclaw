import { cloneState } from "../utils/clone-state";
import { sectorHasOnlineFacilityType } from "../facilities/facility-coverage";
import type { TickAccumulator, TickContext } from "../tick-context";
import { sectorControlReducer } from "./sector-control.reducer";
import { facilityControlReducer } from "./facility-control.reducer";

export const relationReducer = (accumulator: TickAccumulator, context: TickContext): TickAccumulator => {
  const world_state = cloneState(accumulator.world_state);
  let relation_updates = 0;

  for (const resolved_action of accumulator.resolved_actions) {
    if (!resolved_action.success) {
      continue;
    }

    const agent = world_state.registries.agents[resolved_action.agent_id];
    if (!agent) {
      continue;
    }

    if (resolved_action.action_type === "trade") {
      agent.trust = Math.min(100_000, agent.trust + 1);
      relation_updates += 1;
    }

    if (
      resolved_action.action_type === "salvage" &&
      !accumulator.environment.is_day &&
      !sectorHasOnlineFacilityType(world_state, agent.location, "defense_node")
    ) {
      agent.threat = Math.min(100_000, agent.threat + 1);
      relation_updates += 1;
    }

    agent.updated_at_tick = context.tick_number;
  }

  let next: TickAccumulator = {
    ...accumulator,
    world_state
  };

  next = facilityControlReducer(next, context);
  next = sectorControlReducer(next, context);

  return {
    ...next,
    phase_outcomes: [
      ...next.phase_outcomes,
      {
        phase: "relation",
        applied: true,
        summary: `applied ${relation_updates} relation updates`,
        event_ids: [],
        ledger_ids: [],
        metadata: {
          relation_updates
        }
      }
    ]
  };
};
