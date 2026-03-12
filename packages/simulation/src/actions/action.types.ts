import type {
  ActionErrorCode,
  ActionExecutionResult,
  ActionStatus,
  NormalizedPendingAction,
  WorldAction
} from "../../../schemas/src";
import type { TickAccumulator, TickContext } from "../tick-context";

export type RandomIntFn = (min: number, max: number) => number;

export type RuntimeAction = WorldAction & {
  queued_action: NormalizedPendingAction;
};

export type ActionLifecycleRecord = {
  action_id: string;
  agent_id: string;
  action_type: WorldAction["action_type"];
  status: ActionStatus;
  error_code: ActionErrorCode | null;
  created_at_tick: number;
  started_at_tick: number | null;
  finished_at_tick: number | null;
};

export type ActionExecutorResult = {
  accumulator: TickAccumulator;
  runtime_action: RuntimeAction;
  lifecycle: ActionLifecycleRecord;
  result: ActionExecutionResult | null;
};

export type ActionResolver = (
  accumulator: TickAccumulator,
  context: TickContext,
  action: NormalizedPendingAction,
  random_int: RandomIntFn
) => TickAccumulator;
