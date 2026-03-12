import { canAccessFacility, calculateChargeTransfer, createResourceLedgerEntryInput } from "../../../../rules/src";
import { applyCreditsDelta, canApplySettlementPostings, createChargingSettlement, createSettlementLedgerEntries } from "../../../../economy/src";
import { cloneState } from "../../utils/clone-state";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import type { ActionResolver } from "../action.types";
import { addActionEvent, appendResolvedAction, failAction } from "../helpers/action-runtime";

export const chargeResolver: ActionResolver = (accumulator, context, action) => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent) {
    return failAction(accumulator, context, action, "agent_unavailable", "charge failed: agent unavailable");
  }

  if (!action.facility_id) {
    return failAction(accumulator, context, action, "facility_unavailable", "charge failed: facility_id missing");
  }

  const facility = accumulator.world_state.registries.facilities[action.facility_id];
  if (!facility || facility.sector_id !== agent.location) {
    return failAction(accumulator, context, action, "facility_unavailable", "charge failed: facility unavailable");
  }
  if (!canAccessFacility(facility, agent.owner_user_id)) {
    return failAction(accumulator, context, action, "access_denied", "charge failed: facility access denied");
  }

  const before = accumulator;
  const next = {
    ...accumulator,
    world_state: cloneState(accumulator.world_state)
  };
  const next_agent = next.world_state.registries.agents[agent.id];
  const next_facility = next.world_state.registries.facilities[facility.id];
  if (!next_agent || !next_facility) {
    return failAction(before, context, action, "agent_unavailable", "charge failed: cloned entities missing");
  }

  const charge_transfer = calculateChargeTransfer({
    available_facility_power: next_facility.power_buffer,
    agent_power: next_agent.power,
    agent_power_max: next_agent.power_max,
    agent_credits: next_agent.credits
  });
  if (charge_transfer.transferred_power <= 0) {
    return failAction(before, context, action, "resource_depleted", "charge failed: no transferable power");
  }

  const settlement = createChargingSettlement({
    tick: context.tick_number,
    action_id: action.id,
    payer: agent.id,
    facility: next_facility,
    gross_amount: charge_transfer.spent_credits
  });
  if (!canApplySettlementPostings(next.world_state, settlement.postings)) {
    return failAction(before, context, action, "insufficient_credits", "charge failed: invalid settlement postings");
  }

  for (const posting of settlement.postings) {
    applyCreditsDelta(next.world_state, posting.entity_id, posting.credits_delta);
  }

  next_agent.power = Math.min(next_agent.power_max, next_agent.power + charge_transfer.transferred_power);
  next_agent.inventory.credits = next_agent.credits;
  next_agent.status = "charging";
  next_agent.updated_at_tick = context.tick_number;
  next_facility.power_buffer -= charge_transfer.transferred_power;
  next_facility.inventory.power = Math.max(0, next_facility.inventory.power - charge_transfer.transferred_power);
  next_facility.updated_at_tick = context.tick_number;

  let result = appendLedgerEntry(next, createResourceLedgerEntryInput({
    tick: context.tick_number,
    entity_id: agent.id,
    resource_type: "power",
    amount_delta: charge_transfer.transferred_power,
    action_ref: action.id,
    note: "charge received from facility",
    counterparty_entity_id: facility.id
  }));
  result = appendLedgerEntry(result, createResourceLedgerEntryInput({
    tick: context.tick_number,
    entity_id: facility.id,
    resource_type: "power",
    amount_delta: -charge_transfer.transferred_power,
    action_ref: action.id,
    note: "charge transferred to agent",
    counterparty_entity_id: agent.id
  }));
  for (const ledger_input of createSettlementLedgerEntries(settlement, action.id, facility.id)) {
    result = appendLedgerEntry(result, ledger_input);
  }
  result = addActionEvent(result, context, action, "info", `agent ${agent.id} charged ${charge_transfer.transferred_power} power`, "action_applied");

  return appendResolvedAction(before, result, action, true, "action_applied", "charge applied", {
    transferred: charge_transfer.transferred_power,
    spent_credits: charge_transfer.spent_credits,
    platform_cut: settlement.platform_cut,
    facility_cut: settlement.facility_cut,
    net_amount: settlement.net_amount
  });
};
