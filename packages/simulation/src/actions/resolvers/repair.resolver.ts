import { calculateRepairOutcome, canAccessFacility, createResourceLedgerEntryInput } from "../../../../rules/src";
import { applyCreditsDelta, canApplySettlementPostings, createRepairSettlement, createSettlementLedgerEntries, getRepairServicePrice } from "../../../../economy/src";
import { cloneState } from "../../utils/clone-state";
import { decreaseCargoUsed } from "../../utils/cargo";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction, startAction } from "../helpers/action-runtime";

export const repairResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "repair failed: agent unavailable");
  }

  const started = startAction(accumulator, context, action);
  if (!started.current) {
    return failAction(accumulator, context, action, "insufficient_power", "repair failed: insufficient power");
  }

  const next = {
    ...started.current,
    world_state: cloneState(started.current.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  if (!next_agent) {
    return failAction(started.before, context, action, "agent_unavailable", "repair failed: agent missing in cloned state");
  }

  const repair_outcome = calculateRepairOutcome({
    current_durability: next_agent.durability,
    durability_max: next_agent.durability_max
  });
  if (repair_outcome.durability_gain <= 0 || next_agent.inventory.scrap < 1 || next_agent.power < 1) {
    return failAction(started.before, context, action, "insufficient_resources", "repair failed: insufficient repair resources");
  }

  let result = next;
  let settlement_effects = {
    platform_cut: 0,
    facility_cut: 0,
    net_amount: 0,
    service_price: 0
  };

  if (action.facility_id) {
    const facility = result.world_state.registries.facilities[action.facility_id];
    if (!facility || facility.sector_id !== next_agent.location) {
      return failAction(started.before, context, action, "facility_unavailable", "repair failed: repair facility unavailable");
    }
    if (!canAccessFacility(facility, next_agent.owner_user_id)) {
      return failAction(started.before, context, action, "access_denied", "repair failed: repair facility access denied");
    }
    const service_price = getRepairServicePrice();
    if (next_agent.credits < service_price) {
      return failAction(started.before, context, action, "insufficient_credits", "repair failed: insufficient service credits");
    }
    const settlement = createRepairSettlement({
      tick: context.tick_number,
      action_id: action.id,
      payer: next_agent.id,
      facility,
      gross_amount: service_price
    });
    if (!canApplySettlementPostings(result.world_state, settlement.postings)) {
      return failAction(started.before, context, action, "insufficient_credits", "repair failed: invalid settlement postings");
    }
    for (const posting of settlement.postings) {
      applyCreditsDelta(result.world_state, posting.entity_id, posting.credits_delta);
    }
    for (const ledger_input of createSettlementLedgerEntries(settlement, action.id, facility.id)) {
      result = appendLedgerEntry(result, ledger_input);
    }
    result.world_state.registries.agents[agent.id]!.inventory.credits = result.world_state.registries.agents[agent.id]!.credits;
    settlement_effects = {
      platform_cut: settlement.platform_cut,
      facility_cut: settlement.facility_cut,
      net_amount: settlement.net_amount,
      service_price
    };
  }

  const repaired_agent = result.world_state.registries.agents[agent.id]!;
  repaired_agent.inventory.scrap -= 1;
  decreaseCargoUsed(repaired_agent, 1);
  repaired_agent.power = Math.max(0, repaired_agent.power - 1);
  repaired_agent.durability = Math.min(repaired_agent.durability_max, repaired_agent.durability + repair_outcome.durability_gain);
  repaired_agent.status = "repairing";
  repaired_agent.updated_at_tick = context.tick_number;

  result = appendLedgerEntry(result, createResourceLedgerEntryInput({
    tick: context.tick_number,
    entity_id: agent.id,
    resource_type: "scrap",
    amount_delta: -1,
    action_ref: action.id,
    note: "repair consumed scrap"
  }));
  result = appendLedgerEntry(result, createResourceLedgerEntryInput({
    tick: context.tick_number,
    entity_id: agent.id,
    resource_type: "power",
    amount_delta: -1,
    action_ref: action.id,
    note: "repair consumed power"
  }));
  result = addActionEvent(result, context, action, "info", `agent ${agent.id} repaired durability`, "action_applied");

  return appendResolvedAction(started.before, result, action, true, "action_applied", "repair applied", {
    durability_gain: repair_outcome.durability_gain,
    ...settlement_effects
  });
};
