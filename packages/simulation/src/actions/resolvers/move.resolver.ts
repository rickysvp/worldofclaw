import { canMoveBetweenSectors } from "../../../../rules/src";
import { cloneState } from "../../utils/clone-state";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const moveResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "move failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "move failed: insufficient power");
  }

  if (!action.target_sector_id || !started.current.world_state.registries.sectors[action.target_sector_id]) {
    return failAction(started.before, context, action, "target_missing", "move failed: target sector missing");
  }

  const from_sector = started.current.world_state.registries.sectors[agent.location];
  const to_sector = started.current.world_state.registries.sectors[action.target_sector_id];
  if (!from_sector || !to_sector) {
    return failAction(started.before, context, action, "target_missing", "move failed: target sector missing");
  }

  const movement_check = canMoveBetweenSectors(started.current.world_state, from_sector, to_sector, agent.owner_user_id);
  if (!movement_check.allowed) {
    return failAction(
      started.before,
      context,
      action,
      movement_check.error_code ?? "invalid_location",
      movement_check.error_code === "access_denied"
        ? "move failed: access denied"
        : movement_check.error_code === "sector_not_adjacent"
          ? "move failed: target sector not adjacent"
          : "move failed: invalid target sector"
    );
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  if (!next_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "move failed: agent missing in cloned state");
  }

  next_agent.location = action.target_sector_id;
  next_agent.status = "moving";
  next_agent.updated_at_tick = context.tick_number;

  const with_event = addActionEvent(
    next,
    context,
    action,
    "info",
    `agent ${agent.id} moved to ${action.target_sector_id}`,
    "action_applied"
  );

  return appendResolvedAction(started.before, with_event, action, true, "action_applied", "move applied", {
    target_sector_id: action.target_sector_id
  });
};
