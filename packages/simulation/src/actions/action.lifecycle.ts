import type { ActionErrorCode, ActionExecutionResult, ActionStatus, WorldAction } from "../../../schemas/src";
import type { ActionLifecycleRecord, RuntimeAction } from "./action.types";

export const createActionLifecycleRecord = (action: RuntimeAction): ActionLifecycleRecord => ({
  action_id: action.id,
  agent_id: action.agent_id,
  action_type: action.action_type,
  status: action.status,
  error_code: null,
  created_at_tick: action.created_at_tick,
  started_at_tick: null,
  finished_at_tick: null
});

export const transitionRuntimeAction = (
  action: RuntimeAction,
  status: ActionStatus,
  error_code: ActionErrorCode | null = null
): RuntimeAction => ({
  ...action,
  status,
  error_code
});

export const startLifecycle = (
  action: RuntimeAction,
  tick_number: number
): { runtime_action: RuntimeAction; lifecycle: ActionLifecycleRecord } => ({
  runtime_action: transitionRuntimeAction(action, "running"),
  lifecycle: {
    ...createActionLifecycleRecord(action),
    status: "running",
    started_at_tick: tick_number
  }
});

export const completeLifecycle = (
  lifecycle: ActionLifecycleRecord,
  result: ActionExecutionResult | null,
  tick_number: number
): ActionLifecycleRecord => ({
  ...lifecycle,
  status: result?.status ?? "failed",
  error_code: result?.error_code ?? lifecycle.error_code,
  finished_at_tick: tick_number
});
