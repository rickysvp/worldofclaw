import { getSalvageYield } from "../../../../rules/src";
import { cloneState } from "../../utils/clone-state";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import { transferSectorResourceToAgent } from "../../resources/resource-transfer";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const salvageResolver: ActionResolver = (accumulator, context, action, random_int) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "salvage failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "salvage failed: insufficient power");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  const next_sector = next.world_state.registries.sectors[agent.location];
  if (!next_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "salvage failed: agent missing in cloned state");
  }
  if (!next_sector) {
    return failAction(started.before, context, action, "target_missing", "salvage failed: sector missing");
  }

  const salvage_yield = getSalvageYield(next_sector, Math.max(0, random_int(1, 3) - 1));
  const transfer = transferSectorResourceToAgent(next.world_state, next_agent.location, next_agent.id, "scrap", salvage_yield);
  next.world_state = transfer.world_state;
  if (transfer.transferred <= 0) {
    return failAction(started.before, context, action, "resource_depleted", "salvage failed: sector scrap depleted");
  }

  const transferred_agent = next.world_state.registries.agents[agent.id];
  if (!transferred_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "salvage failed: transferred agent missing");
  }

  transferred_agent.status = "operating";
  transferred_agent.updated_at_tick = context.tick_number;

  let result = appendLedgerEntry(next, {
    tick: context.tick_number,
    kind: "resource_delta",
    resource_type: "scrap",
    amount_delta: transfer.transferred,
    credits_delta: 0,
    entity_id: agent.id,
    counterparty_entity_id: next_agent.location,
    action_ref: action.id,
    note: "salvage yielded scrap",
    payload: {}
  });

  result = addActionEvent(result, context, action, "info", `agent ${agent.id} salvaged ${transfer.transferred} scrap`, "action_applied");
  return appendResolvedAction(started.before, result, action, true, "action_applied", "salvage applied", {
    transferred: transfer.transferred
  });
};
