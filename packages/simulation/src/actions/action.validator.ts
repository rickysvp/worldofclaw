import { pending_action_schema, to_world_action, world_action_schema, type PendingAction } from "../../../schemas/src";
import type { TickEngineIssue } from "../tick-context";
import type { RuntimeAction } from "./action.types";

export const validatePendingAction = (input: unknown) => pending_action_schema.safeParse(input);

export const validateWorldAction = (input: unknown) => world_action_schema.safeParse(input);

export const validateRuntimeAction = (action: RuntimeAction) => validateWorldAction(action);

export const validateActionQueueSchema = (action_queue: ReadonlyArray<PendingAction>): TickEngineIssue[] => {
  const issues: TickEngineIssue[] = [];

  for (const action of action_queue) {
    const parsed = validatePendingAction(action);
    if (!parsed.success) {
      for (const issue of parsed.error.issues) {
        issues.push({
          code: "invalid_action_payload",
          message: `action ${String((action as { id?: string }).id ?? "unknown")} invalid at ${issue.path.join(".") || "$"}: ${issue.message}`
        });
      }
      continue;
    }

    const normalized = to_world_action(parsed.data);
    const normalized_parse = validateWorldAction(normalized);
    if (!normalized_parse.success) {
      for (const issue of normalized_parse.error.issues) {
        issues.push({
          code: "invalid_action_payload",
          message: `action ${parsed.data.id} normalized invalid at ${issue.path.join(".") || "$"}: ${issue.message}`
        });
      }
    }
  }

  return issues;
};
