import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { buildRollbackPlan, createRecoverySnapshot, getRecoverySnapshot, recoverLedgerDrift, recoverQueueBacklog, recoverServiceRestart, recoverStaleSession, recoverTickStall, resetSnapshotStore, restoreRecoverySnapshot, verifyReplayFromSnapshot } from "../../packages/recovery/src";

describe("chaos recovery", () => {
  beforeEach(() => {
    resetSnapshotStore();
  });

  it("supports snapshot restore, replay verify, and recovery drills", () => {
    const world = createDefaultWorldState("recovery_seed");
    const snapshot = createRecoverySnapshot({ tick: 0, world_state: world, action_queue: [] });
    const stored = getRecoverySnapshot(0);
    if (!stored) throw new Error("missing snapshot");
    const restored = restoreRecoverySnapshot(stored);
    const replay = verifyReplayFromSnapshot(restored);
    const rollback = buildRollbackPlan(0);

    expect(snapshot.snapshot_id).toBe("snapshot_0");
    expect(replay.matches).toBe(true);
    expect(rollback.steps.length).toBeGreaterThan(0);
    expect(recoverTickStall(true).verification_passed).toBe(true);
    expect(recoverQueueBacklog(0).verification_passed).toBe(true);
    expect(recoverStaleSession(0).verification_passed).toBe(true);
    expect(recoverLedgerDrift(0).verification_passed).toBe(true);
    expect(recoverServiceRestart(true).verification_passed).toBe(true);
  });
});
