import { replayTick } from "../../../../packages/audit/src";
import type { PendingAction } from "../../../../packages/simulation/src/tick-context";
import type { WorldState } from "../../../../packages/schemas/src";
import { getWorldState } from "../../../api/src/services/session.service";

type ReplaySnapshotRecord = {
  tick_number: number;
  world_state: WorldState;
  seed?: string;
  action_queue?: ReadonlyArray<PendingAction>;
  expected_checksum?: string;
};

const replay_store = new Map<number, ReplaySnapshotRecord>();

export const resetReplayStore = (): void => {
  replay_store.clear();
};

export const recordReplaySnapshot = (snapshot: ReplaySnapshotRecord): void => {
  replay_store.set(snapshot.tick_number, structuredClone(snapshot));
};

export const replayCurrentWorldTick = (
  options: { tick_number?: number; seed?: string; action_queue?: ReadonlyArray<PendingAction>; expected_checksum?: string } = {}
) => {
  if (options.tick_number !== undefined) {
    const snapshot = replay_store.get(options.tick_number) ?? null;
    if (!snapshot) {
      return null;
    }
    return replayTick(snapshot.world_state, {
      ...(snapshot.seed ? { seed: snapshot.seed } : {}),
      ...(snapshot.action_queue ? { action_queue: snapshot.action_queue } : {}),
      ...(options.expected_checksum
        ? { expected_checksum: options.expected_checksum }
        : snapshot.expected_checksum
          ? { expected_checksum: snapshot.expected_checksum }
          : {})
    });
  }

  return replayTick(getWorldState(), {
    ...(options.seed ? { seed: options.seed } : {}),
    ...(options.action_queue ? { action_queue: options.action_queue } : {}),
    ...(options.expected_checksum ? { expected_checksum: options.expected_checksum } : {})
  });
};
