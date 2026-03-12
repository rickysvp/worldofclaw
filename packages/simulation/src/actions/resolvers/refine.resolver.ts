import {
  canRefineComputeCore,
  canAccessFacility,
  createResourceLedgerEntryInput,
  refining_recipe,
  resolveRefiningAttempt
} from "../../../../rules/src";
import { applyCreditsDelta, canApplySettlementPostings, createRefinerySettlement, createSettlementLedgerEntries, getRefineryServicePrice } from "../../../../economy/src";
import { cloneState } from "../../utils/clone-state";
import { decreaseCargoUsed, increaseCargoUsed } from "../../utils/cargo";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const refineResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "refine failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "refine failed: insufficient power");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  if (!next_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "refine failed: agent missing in cloned state");
  }

  const refinery = Object.values(next.world_state.registries.facilities).find(
    (facility) =>
      facility.facility_type === "refinery" &&
      facility.sector_id === next_agent.location &&
      facility.status === "online" &&
      canAccessFacility(facility, next_agent.owner_user_id)
  );
  if (!refinery) {
    return failAction(started.before, context, action, "facility_unavailable", "refine failed: refinery unavailable");
  }
  if (!canRefineComputeCore({ xenite: next_agent.inventory.xenite, circuit: next_agent.inventory.circuit, power: next_agent.power })) {
    return failAction(started.before, context, action, "insufficient_resources", "refine failed: insufficient materials");
  }

  const refinery_service_price = getRefineryServicePrice();
  if (next_agent.credits < refinery_service_price) {
    return failAction(started.before, context, action, "insufficient_credits", "refine failed: insufficient service credits");
  }

  let result = next;
  const settlement = createRefinerySettlement({
    tick: context.tick_number,
    action_id: action.id,
    payer: next_agent.id,
    facility: refinery,
    gross_amount: refinery_service_price
  });
  if (!canApplySettlementPostings(result.world_state, settlement.postings)) {
    return failAction(started.before, context, action, "insufficient_credits", "refine failed: invalid settlement postings");
  }
  for (const posting of settlement.postings) {
    applyCreditsDelta(result.world_state, posting.entity_id, posting.credits_delta);
  }
  for (const ledger_input of createSettlementLedgerEntries(settlement, action.id, refinery.id)) {
    result = appendLedgerEntry(result, ledger_input);
  }

  const refined_agent = result.world_state.registries.agents[agent.id]!;
  refined_agent.inventory.credits = refined_agent.credits;
  refined_agent.inventory.xenite -= refining_recipe.xenite;
  refined_agent.inventory.circuit -= refining_recipe.circuit;
  refined_agent.power = Math.max(0, refined_agent.power - refining_recipe.power);
  decreaseCargoUsed(refined_agent, refining_recipe.xenite + refining_recipe.circuit);
  const refining_roll = (context.tick_number + action.id.length + agent.id.length) % 100;
  const refining_attempt = resolveRefiningAttempt(refining_roll);
  if (refining_attempt.succeeded) {
    refined_agent.inventory.compute_core += refining_recipe.compute_core;
    increaseCargoUsed(refined_agent, refining_recipe.compute_core);
  }
  refined_agent.status = "operating";
  refined_agent.updated_at_tick = context.tick_number;

  result = appendLedgerEntry(result, createResourceLedgerEntryInput({
    tick: context.tick_number,
    entity_id: agent.id,
    resource_type: "xenite",
    amount_delta: -refining_recipe.xenite,
    action_ref: action.id,
    note: "refine consumed xenite"
  }));
  result = appendLedgerEntry(result, createResourceLedgerEntryInput({
    tick: context.tick_number,
    entity_id: agent.id,
    resource_type: "circuit",
    amount_delta: -refining_recipe.circuit,
    action_ref: action.id,
    note: "refine consumed circuit"
  }));
  result = appendLedgerEntry(result, createResourceLedgerEntryInput({
    tick: context.tick_number,
    entity_id: agent.id,
    resource_type: "power",
    amount_delta: -refining_recipe.power,
    action_ref: action.id,
    note: "refine consumed power"
  }));
  if (refining_attempt.succeeded) {
    result = appendLedgerEntry(result, createResourceLedgerEntryInput({
      tick: context.tick_number,
      entity_id: agent.id,
      resource_type: "compute_core",
      amount_delta: refining_recipe.compute_core,
      action_ref: action.id,
      note: "refine produced compute_core"
    }));
  }
  result = addActionEvent(result, context, action, "info", `agent ${agent.id} refinement ${refining_attempt.succeeded ? "succeeded" : "failed"}`, "action_applied");

  return appendResolvedAction(started.before, result, action, true, "action_applied", "refine applied", {
    succeeded: refining_attempt.succeeded,
    output_resource: "compute_core",
    service_price: refinery_service_price,
    platform_cut: settlement.platform_cut,
    facility_cut: settlement.facility_cut,
    net_amount: settlement.net_amount
  });
};
