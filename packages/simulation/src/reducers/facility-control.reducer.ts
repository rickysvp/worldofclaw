import type { Facility, WorldEvent } from "../../../schemas/src";
import { normalizeFacilityControlState } from "../../../rules/src";
import type { TickAccumulator, TickContext } from "../tick-context";
import { cloneState } from "../utils/clone-state";
import { appendLedgerEntry } from "../utils/ledger-helper";

const appendFacilityEvent = (
  accumulator: TickAccumulator,
  context: TickContext,
  facility: Facility,
  message: string
): TickAccumulator => {
  const nextEventCounter = accumulator.event_counter + 1;
  const event: WorldEvent = {
    id: `event_${context.tick_number}_${String(nextEventCounter).padStart(4, "0")}`,
    version: 1,
    created_at_tick: context.tick_number,
    updated_at_tick: context.tick_number,
    tick: context.tick_number,
    kind: "facility",
    level: "warn",
    action: null,
    source_entity_id: facility.id,
    target_entity_id: null,
    sector_id: facility.sector_id,
    title: "facility_control",
    message,
    error_code: null,
    payload: {
      facility_id: facility.id,
      status: facility.status
    }
  };

  return {
    ...accumulator,
    event_counter: nextEventCounter,
    emitted_events: [...accumulator.emitted_events, event]
  };
};

export const facilityControlReducer = (accumulator: TickAccumulator, context: TickContext): TickAccumulator => {
  let next = {
    ...accumulator,
    world_state: cloneState(accumulator.world_state)
  };

  for (const facility of Object.values(next.world_state.registries.facilities)) {
    const normalized = normalizeFacilityControlState(facility, context.tick_number);
    if (normalized.status === facility.status && normalized.disabled_at_tick === facility.disabled_at_tick) {
      continue;
    }

    next.world_state.registries.facilities[facility.id] = normalized;
    next = appendLedgerEntry(next, {
      tick: context.tick_number,
      kind: "registry_change",
      resource_type: null,
      amount_delta: 0,
      credits_delta: 0,
      entity_id: facility.id,
      counterparty_entity_id: null,
      action_ref: null,
      note: "facility control state updated",
      payload: {
        previous_status: facility.status,
        next_status: normalized.status
      }
    });
    next = appendFacilityEvent(next, context, normalized, `facility ${facility.id} is now ${normalized.status}`);
  }

  return next;
};
