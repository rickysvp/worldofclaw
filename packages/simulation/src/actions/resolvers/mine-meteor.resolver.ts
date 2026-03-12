import { getMeteorResourcePick } from "../../../../rules/src";
import { cloneState } from "../../utils/clone-state";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import { transferSectorResourceToAgent } from "../../resources/resource-transfer";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const mineMeteorResolver: ActionResolver = (accumulator, context, action, random_int) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "mine_meteor failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "mine_meteor failed: insufficient power");
  }

  const sector = started.current.world_state.registries.sectors[agent.location];
  if (!sector || sector.terrain_type !== "meteor_crater") {
    return failAction(started.before, context, action, "terrain_mismatch", "mine_meteor failed: not in meteor crater");
  }

  const preferred = action.preferred_resource_type === "xenite" || action.preferred_resource_type === "flux" ? action.preferred_resource_type : null;
  const resource_type = getMeteorResourcePick(sector, preferred, random_int(0, 99));

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const transfer = transferSectorResourceToAgent(next.world_state, agent.location, agent.id, resource_type, 1);
  next.world_state = transfer.world_state;
  if (transfer.transferred <= 0) {
    return failAction(started.before, context, action, "resource_depleted", `mine_meteor failed: ${resource_type} depleted`);
  }

  const next_agent = next.world_state.registries.agents[agent.id];
  if (!next_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "mine_meteor failed: agent missing");
  }
  next_agent.status = "operating";
  next_agent.updated_at_tick = context.tick_number;

  let result = appendLedgerEntry(next, {
    tick: context.tick_number,
    kind: "resource_delta",
    resource_type,
    amount_delta: transfer.transferred,
    credits_delta: 0,
    entity_id: agent.id,
    counterparty_entity_id: agent.location,
    action_ref: action.id,
    note: "mine_meteor yielded resource",
    payload: {}
  });
  result = addActionEvent(
    result,
    context,
    action,
    "info",
    `agent ${agent.id} mined ${transfer.transferred} ${resource_type}`,
    "action_applied"
  );

  return appendResolvedAction(started.before, result, action, true, "action_applied", "mine_meteor applied", {
    resource_type,
    transferred: transfer.transferred
  });
};
