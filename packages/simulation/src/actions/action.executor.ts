import type { PendingAction } from "../../../schemas/src";
import type { TickAccumulator, TickContext } from "../tick-context";
import { terminal_action_statuses } from "./action.constants";
import { createExecutionResult } from "./action.result";
import { dispatchActionResolver } from "./action-dispatcher";
import { createActionQueue } from "./action.queue";
import { completeLifecycle, startLifecycle } from "./action.lifecycle";
import { mapResultCodeToErrorCode } from "./action.errors";
import { failAction } from "./helpers/action-runtime";
import type { ActionExecutorResult, RandomIntFn } from "./action.types";

const getLatestResolvedAction = (accumulator: TickAccumulator) => accumulator.resolved_actions[accumulator.resolved_actions.length - 1] ?? null;

export const executeAction = (
  accumulator: TickAccumulator,
  context: TickContext,
  action: PendingAction,
  random_int: RandomIntFn
): ActionExecutorResult => {
  const runtime_action = createActionQueue([action])[0]!;
  const started = startLifecycle(runtime_action, context.tick_number);
  const next_accumulator = dispatchActionResolver(accumulator, context, runtime_action.queued_action, random_int);
  const latest_result = getLatestResolvedAction(next_accumulator);
  const result = latest_result
    ? latest_result
    : createExecutionResult(
        runtime_action.queued_action,
        "failed",
        "invalid_action_payload",
        "action execution failed without a result",
        context.tick_number,
        "ACTION_INVALID_PAYLOAD",
        [],
        [],
        {}
      );

  const lifecycle = completeLifecycle(
    {
      ...started.lifecycle,
      error_code: result.error_code ?? mapResultCodeToErrorCode(result.result_code)
    },
    result,
    context.tick_number
  );

  return {
    accumulator: next_accumulator,
    runtime_action: {
      ...started.runtime_action,
      status: lifecycle.status,
      error_code: lifecycle.error_code
    },
    lifecycle,
    result
  };
};

export const executeActionQueue = (
  accumulator: TickAccumulator,
  context: TickContext,
  random_int: RandomIntFn
): TickAccumulator => {
  let next = accumulator;
  const queue = createActionQueue(context.action_queue);
  const running_agents = new Set<string>();

  for (const queued_action of queue) {
    if (running_agents.has(queued_action.agent_id)) {
      next = failAction(
        next,
        context,
        queued_action.queued_action,
        "agent_unavailable",
        `action blocked: agent ${queued_action.agent_id} already has a running action`
      );
      continue;
    }

    running_agents.add(queued_action.agent_id);
    const execution = executeAction(next, context, queued_action.queued_action, random_int);
    next = execution.accumulator;

    if (terminal_action_statuses.includes(execution.lifecycle.status)) {
      running_agents.delete(queued_action.agent_id);
    }
  }

  return next;
};
