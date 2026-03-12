import { cloneState } from "../utils/clone-state";
import type { TickAccumulator, TickContext } from "../tick-context";

export const eventEmissionReducer = (accumulator: TickAccumulator, context: TickContext): TickAccumulator => {
  const world_state = cloneState(accumulator.world_state);
  const event_ids: string[] = [];

  for (const event of accumulator.emitted_events) {
    world_state.registries.events[event.id] = event;
    event_ids.push(event.id);
  }

  world_state.meta.current_tick = context.tick_number;
  world_state.meta.updated_at_tick = context.tick_number;

  return {
    ...accumulator,
    world_state,
    phase_outcomes: [
      ...accumulator.phase_outcomes,
      {
        phase: "event_emission",
        applied: true,
        summary: `emitted ${event_ids.length} events`,
        event_ids,
        ledger_ids: [],
        metadata: {
          emitted_event_count: event_ids.length
        }
      }
    ]
  };
};
