import type { ActionResultCode, PendingAction, WorldEvent } from "../../../../schemas/src";
import type { TickAccumulator, TickContext } from "../../tick-context";
import { cloneState } from "../../utils/clone-state";
import { appendLedgerEntry } from "../../utils/ledger-helper";
import { getActionPowerCost } from "../action-profile";
import { mapResultCodeToErrorCode } from "../action.errors";

export const collectNewEventIds = (before: TickAccumulator, after: TickAccumulator): string[] =>
  after.emitted_events.slice(before.emitted_events.length).map((event) => event.id);

export const collectNewLedgerIds = (before: TickAccumulator, after: TickAccumulator): string[] =>
  after.created_ledger_entries.slice(before.created_ledger_entries.length).map((entry) => entry.id);

export const addActionEvent = (
  accumulator: TickAccumulator,
  context: TickContext,
  action: PendingAction,
  level: "info" | "warn",
  message: string,
  result_code: ActionResultCode
): TickAccumulator => {
  const next_event_counter = accumulator.event_counter + 1;
  const event: WorldEvent = {
    id: `event_${context.tick_number}_${String(next_event_counter).padStart(4, "0")}`,
    version: 1,
    created_at_tick: context.tick_number,
    updated_at_tick: context.tick_number,
    tick: context.tick_number,
    kind: "agent",
    level,
    action: action.action_type,
    source_entity_id: action.agent_id,
    target_entity_id: action.target_agent_id ?? action.facility_id ?? action.target_sector_id ?? action.claim_target_id ?? null,
    sector_id: action.target_sector_id ?? null,
    title: `action_${action.action_type}`,
    message,
    error_code: level === "warn" ? result_code : null,
    payload: {
      action_id: action.id,
      result_code
    }
  };

  return {
    ...accumulator,
    event_counter: next_event_counter,
    emitted_events: [...accumulator.emitted_events, event]
  };
};

export const appendResolvedAction = (
  before: TickAccumulator,
  after: TickAccumulator,
  action: PendingAction,
  success: boolean,
  result_code: ActionResultCode,
  summary: string,
  effects: Record<string, string | number | boolean> = {}
): TickAccumulator => ({
  ...after,
  processed_action_ids: [...after.processed_action_ids, action.id],
  resolved_actions: [
    ...after.resolved_actions,
    {
      action_id: action.id,
      agent_id: action.agent_id,
      action_type: action.action_type,
      status: success ? "succeeded" : "failed",
      success,
      result_code,
      error_code: success ? null : mapResultCodeToErrorCode(result_code),
      summary,
      started_at_tick: before.world_state.meta.current_tick + 1,
      finished_at_tick: after.world_state.meta.current_tick + 1,
      event_ids: collectNewEventIds(before, after),
      ledger_ids: collectNewLedgerIds(before, after),
      effects
    }
  ]
});

export const failAction = (
  before: TickAccumulator,
  context: TickContext,
  action: PendingAction,
  result_code: ActionResultCode,
  message: string
): TickAccumulator => {
  const with_event = addActionEvent(before, context, action, "warn", message, result_code);
  return appendResolvedAction(before, with_event, action, false, result_code, message);
};

const applyActionPowerCost = (
  accumulator: TickAccumulator,
  context: TickContext,
  action: PendingAction,
  cost: number
): TickAccumulator | null => {
  if (cost <= 0) {
    return accumulator;
  }

  const next = {
    ...accumulator,
    world_state: cloneState(accumulator.world_state)
  };
  const next_agent = next.world_state.registries.agents[action.agent_id];
  if (!next_agent || next_agent.power < cost) {
    return null;
  }

  next_agent.power -= cost;
  next_agent.updated_at_tick = context.tick_number;

  return appendLedgerEntry(next, {
    tick: context.tick_number,
    kind: "resource_delta",
    resource_type: "power",
    amount_delta: -cost,
    credits_delta: 0,
    entity_id: action.agent_id,
    counterparty_entity_id: null,
    action_ref: action.id,
    note: `${action.action_type} action power cost`,
    payload: {
      power_cost: cost
    }
  });
};

export const startAction = (
  accumulator: TickAccumulator,
  context: TickContext,
  action: PendingAction
): { before: TickAccumulator; current: TickAccumulator } | { before: TickAccumulator; current: null } => {
  const cost = getActionPowerCost(action.action_type);
  const current = applyActionPowerCost(accumulator, context, action, cost);
  return {
    before: accumulator,
    current
  };
};
