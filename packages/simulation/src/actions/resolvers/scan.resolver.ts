import { cloneState } from "../../utils/clone-state";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const scanResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "scan failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "scan failed: insufficient power");
  }

  const world_state = cloneState(started.current.world_state);
  const next_agent = world_state.registries.agents[agent.id];
  const sector = world_state.registries.sectors[agent.location];
  if (!next_agent || !sector) {
    return failAction(started.before, context, action, "target_missing", "scan failed: sector missing");
  }

  next_agent.status = "operating";
  next_agent.updated_at_tick = context.tick_number;

  const with_event = addActionEvent(
    {
      ...started.current,
      world_state
    },
    context,
    action,
    "info",
    `agent ${agent.id} scanned sector ${agent.location}`,
    "action_applied"
  );

  return appendResolvedAction(started.before, with_event, action, true, "action_applied", "scan applied", {
    terrain_type: sector.terrain_type,
    danger_level: sector.danger_level,
    salvage_yield_rating: sector.salvage_yield_rating
  });
};
