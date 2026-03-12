import type { TickContext, TickEngineIssue } from "./tick-context";
import type { WorldState } from "../../schemas/src";
import { validateActionQueueSchema } from "./actions/action-validator";

export const createIdempotencyKey = (world_id: string, tick_number: number): string => `${world_id}:${tick_number}`;

export const guardDuplicateTick = (world_state: WorldState, context: TickContext): TickEngineIssue | null => {
  const idempotency_key = createIdempotencyKey(world_state.meta.id, context.tick_number);
  return context.processed_receipts[idempotency_key]
    ? {
        code: "tick_already_processed",
        message: `tick ${context.tick_number} has already been processed for world ${world_state.meta.id}`
      }
    : null;
};

export const guardTickProgression = (world_state: WorldState, context: TickContext): TickEngineIssue | null =>
  context.tick_number !== world_state.meta.current_tick + 1
    ? {
        code: "invalid_tick_progression",
        message: "tick_number must equal current_tick + 1"
      }
    : null;

export const guardActionQueue = (context: TickContext): TickEngineIssue[] => {
  const seen = new Set<string>();
  const issues: TickEngineIssue[] = [...validateActionQueueSchema(context.action_queue)];

  for (const action of context.action_queue) {
    if (action.tick_number !== context.tick_number) {
      issues.push({
        code: "action_tick_mismatch",
        message: `action ${action.id} targets tick ${action.tick_number}, expected ${context.tick_number}`
      });
    }
    if (seen.has(action.id)) {
      issues.push({
        code: "duplicate_action_id",
        message: `action ${action.id} is duplicated in the queue`
      });
    }
    seen.add(action.id);
  }

  return issues;
};
