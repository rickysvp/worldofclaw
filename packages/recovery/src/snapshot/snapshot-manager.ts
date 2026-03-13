import type { PendingAction } from "../../../simulation/src/tick-context";
import type { WorldState } from "../../../schemas/src";
import type { RecoverySnapshot } from "../recovery.types";

const snapshot_store = new Map<number, RecoverySnapshot>();

export const resetSnapshotStore = (): void => snapshot_store.clear();

export const createRecoverySnapshot = (input: { tick: number; world_state: WorldState; action_queue?: ReadonlyArray<PendingAction> }): RecoverySnapshot => {
  const snapshot: RecoverySnapshot = {
    snapshot_id: `snapshot_${input.tick}`,
    tick: input.tick,
    world_state: structuredClone(input.world_state),
    action_queue: structuredClone(input.action_queue ?? [])
  };
  snapshot_store.set(input.tick, snapshot);
  return structuredClone(snapshot);
};

export const getRecoverySnapshot = (tick: number): RecoverySnapshot | null => structuredClone(snapshot_store.get(tick) ?? null);
