import type { Agent, WorldEvent } from "../../../schemas/src";
import { applyAgentPassiveDecay, applyFacilityPassiveDecay, createResourceLedgerEntryInput } from "../../../rules/src";
import { sectorHasOnlineFacilityType } from "../facilities/facility-coverage";
import { cloneState } from "../utils/clone-state";
import { appendLedgerEntry } from "../utils/ledger-helper";
import type { TickAccumulator, TickContext } from "../tick-context";

const add_event = (
  accumulator: TickAccumulator,
  context: TickContext,
  title: string,
  message: string,
  level: "info" | "warn",
  agent_id: string
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
    action: null,
    source_entity_id: null,
    target_entity_id: agent_id,
    sector_id: null,
    title,
    message,
    error_code: null,
    payload: {}
  };

  return {
    ...accumulator,
    event_counter: next_event_counter,
    emitted_events: [...accumulator.emitted_events, event]
  };
};

export const agentUpkeepReducer = (accumulator: TickAccumulator, context: TickContext): TickAccumulator => {
  let next = {
    ...accumulator,
    world_state: cloneState(accumulator.world_state)
  };
  const event_ids: string[] = [];
  const ledger_ids: string[] = [];

  for (const facility of Object.values(next.world_state.registries.facilities)) {
    next.world_state.registries.facilities[facility.id] = applyFacilityPassiveDecay(facility, context.tick_number);
  }

  for (const agent of Object.values(next.world_state.registries.agents) as Agent[]) {
    const has_facility_shelter = sectorHasOnlineFacilityType(next.world_state, agent.location, "shelter");
    const has_shelter_coverage = agent.shelter_level > 0 || has_facility_shelter;
    const previous_power = agent.power;
    const previous_status = agent.status;
    const next_agent = applyAgentPassiveDecay(agent, {
      is_day: next.environment.is_day,
      has_shelter: has_shelter_coverage,
      tick_number: context.tick_number
    });
    next.world_state.registries.agents[agent.id] = next_agent;

    next = appendLedgerEntry(next, createResourceLedgerEntryInput({
      tick: context.tick_number,
      entity_id: agent.id,
      resource_type: "power",
      amount_delta: next_agent.power - previous_power,
      action_ref: "agent_upkeep",
      note: "idle power upkeep applied",
      payload: {
        power_cost: previous_power - next_agent.power
      }
    }));
    ledger_ids.push(next.created_ledger_entries.at(-1)?.id ?? "");

    if (next_agent.status === "stopped" && previous_status !== "stopped") {
      next = add_event(next, context, "agent_stopped", `agent ${agent.id} has stopped due to zero power`, "warn", agent.id);
      event_ids.push(next.emitted_events.at(-1)?.id ?? "");
    }

    if (next_agent.status === "wrecked" && previous_status !== "wrecked") {
      next = add_event(next, context, "agent_wrecked", `agent ${agent.id} has become wrecked`, "warn", agent.id);
      event_ids.push(next.emitted_events.at(-1)?.id ?? "");
    }
  }

  return {
    ...next,
    phase_outcomes: [
      ...next.phase_outcomes,
      {
        phase: "agent_upkeep",
        applied: true,
        summary: `processed upkeep for ${Object.keys(next.world_state.registries.agents).length} agents`,
        event_ids: event_ids.filter((value) => value.length > 0),
        ledger_ids: ledger_ids.filter((value) => value.length > 0),
        metadata: {
          agent_count: Object.keys(next.world_state.registries.agents).length
        }
      }
    ]
  };
};
