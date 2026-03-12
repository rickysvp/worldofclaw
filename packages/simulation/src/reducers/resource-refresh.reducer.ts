import type { Facility, WorldEvent } from "../../../schemas/src";
import { applyFacilityMaintenance, createResourceLedgerEntryInput, produceFacilityResources } from "../../../rules/src";
import { cloneState } from "../utils/clone-state";
import { appendLedgerEntry } from "../utils/ledger-helper";
import type { TickAccumulator, TickContext } from "../tick-context";
import { countMarketQuoteChanges, refreshMarketQuotes } from "../economy/market-refresh";
import { countRefreshedResourceSectors, refreshSectorResources } from "../resources/resource-refresh";

const build_event = (
  accumulator: TickAccumulator,
  context: TickContext,
  title: string,
  message: string,
  level: "info" | "warn",
  target_entity_id: string
): { accumulator: TickAccumulator; event: WorldEvent } => {
  const next_event_counter = accumulator.event_counter + 1;
  const event: WorldEvent = {
    id: `event_${context.tick_number}_${String(next_event_counter).padStart(4, "0")}`,
    version: 1,
    created_at_tick: context.tick_number,
    updated_at_tick: context.tick_number,
    tick: context.tick_number,
    kind: "facility",
    level,
    action: null,
    source_entity_id: null,
    target_entity_id,
    sector_id: null,
    title,
    message,
    error_code: null,
    payload: {}
  };

  return {
    accumulator: {
      ...accumulator,
      event_counter: next_event_counter
    },
    event
  };
};

export const resourceRefreshReducer = (accumulator: TickAccumulator, context: TickContext): TickAccumulator => {
  let next = {
    ...accumulator,
    world_state: refreshMarketQuotes(refreshSectorResources(cloneState(accumulator.world_state)), context.tick_number)
  };

  const event_ids: string[] = [];
  const ledger_ids: string[] = [];
  let generator_count = 0;
  const refreshed_sector_count = countRefreshedResourceSectors(next.world_state);
  const quote_change_count = countMarketQuoteChanges(accumulator.world_state, next.world_state);

  for (const facility of Object.values(next.world_state.registries.facilities) as Facility[]) {
    const maintenance = applyFacilityMaintenance(facility, context.tick_number);
    next.world_state.registries.facilities[facility.id] = maintenance.facility;
    const maintainedFacility = next.world_state.registries.facilities[facility.id]!;

    if (maintenance.consumed_scrap > 0) {
      next = appendLedgerEntry(next, createResourceLedgerEntryInput({
        tick: context.tick_number,
        entity_id: facility.id,
        resource_type: "scrap",
        amount_delta: -maintenance.consumed_scrap,
        action_ref: "resource_refresh",
        note: "generator maintenance consumed scrap",
        payload: {
          facility_type: facility.facility_type
        }
      }));
      ledger_ids.push(next.created_ledger_entries.at(-1)?.id ?? "");
    }

    const production = produceFacilityResources(maintainedFacility);
    next.world_state.registries.facilities[facility.id] = production.facility;

    if (production.produced_power > 0) {
      generator_count += 1;

      next = appendLedgerEntry(next, createResourceLedgerEntryInput({
        tick: context.tick_number,
        entity_id: facility.id,
        resource_type: "power",
        amount_delta: production.produced_power,
        action_ref: "resource_refresh",
        note: "generator produced power",
        payload: {
          facility_type: facility.facility_type
        }
      }));
      ledger_ids.push(next.created_ledger_entries.at(-1)?.id ?? "");

      const built = build_event(next, context, "generator_output", `generator ${facility.id} produced ${production.produced_power} power`, "info", facility.id);
      next = built.accumulator;
      next.emitted_events = [...next.emitted_events, built.event];
      event_ids.push(built.event.id);
    }

    const tracked_facility = next.world_state.registries.facilities[facility.id];
    if (tracked_facility && tracked_facility.durability <= 10) {
      const built = build_event(next, context, "facility_maintenance_warning", `facility ${facility.id} is below maintenance threshold`, "warn", facility.id);
      next = built.accumulator;
      next.emitted_events = [...next.emitted_events, built.event];
      event_ids.push(built.event.id);
    }
  }

  return {
    ...next,
    phase_outcomes: [
      ...next.phase_outcomes,
      {
        phase: "resource_refresh",
        applied: true,
        summary: `refreshed ${generator_count} generator facilities`,
        event_ids,
        ledger_ids: ledger_ids.filter((value) => value.length > 0),
        metadata: {
          generator_count,
          refreshed_sector_count,
          quote_change_count
        }
      }
    ]
  };
};
