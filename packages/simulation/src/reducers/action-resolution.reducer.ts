import type { TickAccumulator, TickContext } from "../tick-context";
import { executeActionQueue } from "../actions/action.executor";

export const actionResolutionReducer = (
  accumulator: TickAccumulator,
  context: TickContext,
  random_int: (min: number, max: number) => number
): TickAccumulator => {
  const starting_event_count = accumulator.emitted_events.length;
  const starting_ledger_count = accumulator.created_ledger_entries.length;
  const next = executeActionQueue(accumulator, context, random_int);

  return {
    ...next,
    phase_outcomes: [
      ...next.phase_outcomes,
      {
        phase: "action_resolution",
        applied: true,
        summary: `resolved ${next.resolved_actions.length} actions`,
        event_ids: next.emitted_events.slice(starting_event_count).map((event) => event.id),
        ledger_ids: next.created_ledger_entries.slice(starting_ledger_count).map((entry) => entry.id),
        metadata: {
          resolved_actions: next.resolved_actions.length
        }
      }
    ]
  };
};
