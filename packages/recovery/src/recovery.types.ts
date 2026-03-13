import type { recovery_incident_types, recovery_statuses } from "./constants";
import type { PendingAction } from "../../simulation/src/tick-context";
import type { WorldState } from "../../schemas/src";

export type RecoveryStatus = (typeof recovery_statuses)[number];
export type RecoveryIncidentType = (typeof recovery_incident_types)[number];

export type RecoverySnapshot = {
  snapshot_id: string;
  tick: number;
  world_state: WorldState;
  action_queue: ReadonlyArray<PendingAction>;
};

export type RecoveryResult = {
  incident_type: RecoveryIncidentType;
  status: RecoveryStatus;
  message: string;
  verification_passed: boolean;
};

export type RollbackPlan = {
  plan_id: string;
  target_tick: number;
  steps: string[];
};
