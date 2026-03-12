import { cloneState } from "../../utils/clone-state";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const attackResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "attack failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "attack failed: insufficient power");
  }
  if (!action.target_agent_id) {
    return failAction(started.before, context, action, "target_missing", "attack failed: target_agent_id missing");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const attacker = next.world_state.registries.agents[agent.id];
  const target = next.world_state.registries.agents[action.target_agent_id];
  if (!attacker || !target || target.location !== attacker.location || target.status === "wrecked" || target.id === attacker.id) {
    return failAction(started.before, context, action, "target_unavailable", "attack failed: target unavailable");
  }

  const damage = 3;
  target.durability = Math.max(0, target.durability - damage);
  target.updated_at_tick = context.tick_number;
  if (target.durability === 0) {
    target.status = "disabled";
  }
  attacker.status = "attacking";
  attacker.updated_at_tick = context.tick_number;

  const result = addActionEvent(
    next,
    context,
    action,
    "info",
    `agent ${attacker.id} attacked ${target.id} for ${damage} durability`,
    "action_applied"
  );

  return appendResolvedAction(started.before, result, action, true, "action_applied", "attack applied", {
    damage,
    target_agent_id: target.id,
    target_status: target.status
  });
};
