import { cloneState } from "../utils/clone-state";
import type { TickAccumulator, TickContext } from "../tick-context";

export const environmentReducer = (accumulator: TickAccumulator, context: TickContext): TickAccumulator => {
  const world_state = cloneState(accumulator.world_state);
  const daylight_cycle_tick = context.tick_number % world_state.config.day_length_ticks;
  const is_day = daylight_cycle_tick < world_state.config.day_length_ticks / 2;

  return {
    ...accumulator,
    world_state,
    environment: {
      is_day,
      daylight_cycle_tick,
      ambient_power_modifier: is_day ? 0 : -1,
      maintenance_pressure: is_day ? 0 : 1
    },
    phase_outcomes: [
      ...accumulator.phase_outcomes,
      {
        phase: "environment",
        applied: true,
        summary: is_day ? "daylight cycle active" : "night cycle active",
        event_ids: [],
        ledger_ids: [],
        metadata: {
          is_day,
          daylight_cycle_tick
        }
      }
    ]
  };
};
