import {
  pending_action_schema,
  to_world_action,
  type NormalizedPendingAction,
  type PendingAction
} from "../../../schemas/src";
import type { RuntimeAction } from "./action.types";

export const normalizeQueuedAction = (action: PendingAction): NormalizedPendingAction => pending_action_schema.parse(action);

export const createRuntimeAction = (action: PendingAction): RuntimeAction => {
  const queued_action = normalizeQueuedAction(action);

  return {
    ...to_world_action(queued_action),
    queued_action
  };
};

export const createActionQueue = (actions: ReadonlyArray<PendingAction>): RuntimeAction[] =>
  actions.map((action) => createRuntimeAction(action));

export const groupQueuedActionsByAgent = (actions: ReadonlyArray<RuntimeAction>): Record<string, RuntimeAction[]> => {
  const grouped: Record<string, RuntimeAction[]> = {};
  for (const action of actions) {
    grouped[action.agent_id] = [...(grouped[action.agent_id] ?? []), action];
  }
  return grouped;
};
