import type { ActionStatus } from "../../../schemas/src";

export const action_status_order: ReadonlyArray<ActionStatus> = [
  "queued",
  "running",
  "succeeded",
  "failed",
  "cancelled"
];

export const terminal_action_statuses: ReadonlyArray<ActionStatus> = [
  "succeeded",
  "failed",
  "cancelled"
];
