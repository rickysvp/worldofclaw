import { cloneState } from "../../utils/clone-state";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const escortResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "escort failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "escort failed: insufficient power");
  }
  if (!action.target_agent_id) {
    return failAction(started.before, context, action, "target_missing", "escort failed: target_agent_id missing");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const escort_agent = next.world_state.registries.agents[agent.id];
  const target_agent = next.world_state.registries.agents[action.target_agent_id];
  if (
    !escort_agent ||
    !target_agent ||
    target_agent.id === escort_agent.id ||
    target_agent.location !== escort_agent.location ||
    target_agent.status === "wrecked"
  ) {
    return failAction(started.before, context, action, "target_unavailable", "escort failed: target unavailable");
  }

  escort_agent.status = "escorting";
  escort_agent.trust = Math.min(100_000, escort_agent.trust + 1);
  escort_agent.updated_at_tick = context.tick_number;
  target_agent.bond = Math.min(100_000, target_agent.bond + 1);
  target_agent.updated_at_tick = context.tick_number;

  const result = addActionEvent(
    next,
    context,
    action,
    "info",
    `agent ${escort_agent.id} is escorting ${target_agent.id}`,
    "action_applied"
  );

  return appendResolvedAction(started.before, result, action, true, "action_applied", "escort applied", {
    target_agent_id: target_agent.id,
    escort_status: escort_agent.status
  });
};
