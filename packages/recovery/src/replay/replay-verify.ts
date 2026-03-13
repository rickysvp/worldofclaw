import { replayTick } from "../../../audit/src";
import type { RecoverySnapshot } from "../recovery.types";

export const verifyReplayFromSnapshot = (snapshot: RecoverySnapshot, expected_checksum?: string) => replayTick(snapshot.world_state, {
  action_queue: snapshot.action_queue,
  ...(expected_checksum ? { expected_checksum } : {})
});
