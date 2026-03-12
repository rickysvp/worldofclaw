import type { Sector, WorldEvent } from "../../../schemas/src";
import { deriveSectorControlSummary } from "../../../rules/src";
import type { TickAccumulator, TickContext } from "../tick-context";
import { cloneState } from "../utils/clone-state";
import { appendLedgerEntry } from "../utils/ledger-helper";

const appendSectorEvent = (
  accumulator: TickAccumulator,
  context: TickContext,
  sector: Sector,
  message: string
): TickAccumulator => {
  const nextEventCounter = accumulator.event_counter + 1;
  const event: WorldEvent = {
    id: `event_${context.tick_number}_${String(nextEventCounter).padStart(4, "0")}`,
    version: 1,
    created_at_tick: context.tick_number,
    updated_at_tick: context.tick_number,
    tick: context.tick_number,
    kind: "world",
    level: sector.control_state === "contested" ? "warn" : "info",
    action: null,
    source_entity_id: sector.id,
    target_entity_id: null,
    sector_id: sector.id,
    title: "sector_control",
    message,
    error_code: null,
    payload: {
      sector_id: sector.id,
      control_state: sector.control_state,
      ...(sector.controller_owner_user_id ? { controller_owner_user_id: sector.controller_owner_user_id } : {})
    }
  };

  return {
    ...accumulator,
    event_counter: nextEventCounter,
    emitted_events: [...accumulator.emitted_events, event]
  };
};

export const sectorControlReducer = (accumulator: TickAccumulator, context: TickContext): TickAccumulator => {
  let next = {
    ...accumulator,
    world_state: cloneState(accumulator.world_state)
  };
  const emittedAndStoredEvents = [
    ...Object.values(next.world_state.registries.events),
    ...next.emitted_events
  ];

  for (const sector of Object.values(next.world_state.registries.sectors)) {
    const facilities = Object.values(next.world_state.registries.facilities).filter((facility) => facility.sector_id === sector.id);
    const summary = deriveSectorControlSummary(sector, facilities, emittedAndStoredEvents, context.tick_number);
    const changed =
      sector.control_state !== summary.control_state ||
      sector.access_policy !== summary.access_policy ||
      sector.controller_owner_user_id !== summary.controller_owner_user_id ||
      sector.control_since_tick !== summary.control_since_tick ||
      sector.contested_since_tick !== summary.contested_since_tick ||
      JSON.stringify(sector.hostile_conflict_ticks) !== JSON.stringify(summary.hostile_conflict_ticks);

    if (!changed) {
      continue;
    }

    const nextSector = next.world_state.registries.sectors[sector.id];
    if (!nextSector) {
      continue;
    }

    nextSector.control_state = summary.control_state;
    nextSector.access_policy = summary.access_policy;
    nextSector.controller_owner_user_id = summary.controller_owner_user_id;
    nextSector.control_since_tick = summary.control_since_tick;
    nextSector.contested_since_tick = summary.contested_since_tick;
    nextSector.hostile_conflict_ticks = summary.hostile_conflict_ticks;
    nextSector.updated_at_tick = context.tick_number;

    next = appendLedgerEntry(next, {
      tick: context.tick_number,
      kind: "registry_change",
      resource_type: null,
      amount_delta: 0,
      credits_delta: 0,
      entity_id: sector.id,
      counterparty_entity_id: summary.controller_owner_user_id,
      action_ref: null,
      note: "sector control updated",
      payload: {
        previous_control_state: sector.control_state,
        next_control_state: summary.control_state,
        ...(sector.controller_owner_user_id ? { previous_controller_owner_user_id: sector.controller_owner_user_id } : {}),
        ...(summary.controller_owner_user_id ? { next_controller_owner_user_id: summary.controller_owner_user_id } : {})
      }
    });
    next = appendSectorEvent(next, context, nextSector, `sector ${sector.id} control is ${summary.control_state}`);
  }

  return next;
};
