import { canCraftResource, createResourceBag } from "../../../../rules/src";
import { sectorHasOnlineFacilityType } from "../../facilities/facility-coverage";
import { cloneState } from "../../utils/clone-state";
import { decreaseCargoUsed, increaseCargoUsed } from "../../utils/cargo";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const craftResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "craft failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "craft failed: insufficient power");
  }
  if (!sectorHasOnlineFacilityType(started.current.world_state, agent.location, "workshop")) {
    return failAction(started.before, context, action, "facility_unavailable", "craft failed: workshop coverage missing");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  if (!next_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "craft failed: agent missing");
  }

  const output_resource = action.preferred_resource_type === "compute_core" ? "compute_core" : "circuit";
  if (!canCraftResource(createResourceBag(next_agent.inventory), output_resource)) {
    return failAction(started.before, context, action, "insufficient_resources", "craft failed: missing recipe inputs");
  }

  if (output_resource === "compute_core") {
    next_agent.inventory.composite -= 1;
    next_agent.inventory.circuit -= 1;
    decreaseCargoUsed(next_agent, 2);
    next_agent.inventory.compute_core += 1;
    increaseCargoUsed(next_agent, 1);
  } else {
    next_agent.inventory.scrap -= 1;
    next_agent.inventory.flux -= 1;
    decreaseCargoUsed(next_agent, 2);
    next_agent.inventory.circuit += 1;
    increaseCargoUsed(next_agent, 1);
  }

  next_agent.status = "operating";
  next_agent.updated_at_tick = context.tick_number;

  let result = next;
  if (output_resource === "compute_core") {
    result = appendLedgerEntry(result, {
      tick: context.tick_number,
      kind: "resource_delta",
      resource_type: "composite",
      amount_delta: -1,
      credits_delta: 0,
      entity_id: agent.id,
      counterparty_entity_id: null,
      action_ref: action.id,
      note: "craft consumed composite",
      payload: {}
    });
    result = appendLedgerEntry(result, {
      tick: context.tick_number,
      kind: "resource_delta",
      resource_type: "circuit",
      amount_delta: -1,
      credits_delta: 0,
      entity_id: agent.id,
      counterparty_entity_id: null,
      action_ref: action.id,
      note: "craft consumed circuit",
      payload: {}
    });
  } else {
    result = appendLedgerEntry(result, {
      tick: context.tick_number,
      kind: "resource_delta",
      resource_type: "scrap",
      amount_delta: -1,
      credits_delta: 0,
      entity_id: agent.id,
      counterparty_entity_id: null,
      action_ref: action.id,
      note: "craft consumed scrap",
      payload: {}
    });
    result = appendLedgerEntry(result, {
      tick: context.tick_number,
      kind: "resource_delta",
      resource_type: "flux",
      amount_delta: -1,
      credits_delta: 0,
      entity_id: agent.id,
      counterparty_entity_id: null,
      action_ref: action.id,
      note: "craft consumed flux",
      payload: {}
    });
  }
  result = appendLedgerEntry(result, {
    tick: context.tick_number,
    kind: "resource_delta",
    resource_type: output_resource,
    amount_delta: 1,
    credits_delta: 0,
    entity_id: agent.id,
    counterparty_entity_id: null,
    action_ref: action.id,
    note: "craft produced output",
    payload: {}
  });
  result = addActionEvent(result, context, action, "info", `agent ${agent.id} crafted 1 ${output_resource}`, "action_applied");

  return appendResolvedAction(started.before, result, action, true, "action_applied", "craft applied", {
    output_resource
  });
};
