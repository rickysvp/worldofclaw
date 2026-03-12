import { advanceWorldTick } from "../../simulation/src/tick-engine";
import { createWorldChecksum } from "../../simulation/src/snapshot";
import type { PendingAction } from "../../simulation/src/tick-context";
import type { ReplayResult } from "./audit.types";
import type { WorldState } from "../../schemas/src";

export const replayTick = (
  world_state: WorldState,
  options: { seed?: string; action_queue?: ReadonlyArray<PendingAction>; expected_checksum?: string } = {}
): ReplayResult => {
  const advance_options = {
    ...(options.seed ? { seed: options.seed } : {}),
    ...(options.action_queue ? { action_queue: options.action_queue } : {})
  };
  const result = advanceWorldTick(world_state, advance_options);
  return {
    tick_number: result.tick_number,
    expected_checksum: options.expected_checksum ?? result.output_checksum,
    replay_checksum: result.output_checksum,
    matches: (options.expected_checksum ?? result.output_checksum) === result.output_checksum,
    state_diff: result.state_diff
  };
};

export const replayTickChecksum = (world_state: WorldState): string => createWorldChecksum(world_state);
