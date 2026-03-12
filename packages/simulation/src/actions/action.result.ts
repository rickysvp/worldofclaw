import type { ActionErrorCode, ActionResultCode, PendingAction } from "../../../schemas/src";
import type { ActionExecutionResult } from "../../../schemas/src";

export const createExecutionResult = (
  action: PendingAction,
  status: ActionExecutionResult["status"],
  result_code: ActionResultCode,
  summary: string,
  tick_number: number,
  error_code: ActionErrorCode | null,
  event_ids: string[],
  ledger_ids: string[],
  effects: Record<string, string | number | boolean>
): ActionExecutionResult => ({
  action_id: action.id,
  agent_id: action.agent_id,
  action_type: action.action_type,
  status,
  success: status === "succeeded",
  result_code,
  error_code,
  summary,
  started_at_tick: tick_number,
  finished_at_tick: tick_number,
  event_ids,
  ledger_ids,
  effects
});
