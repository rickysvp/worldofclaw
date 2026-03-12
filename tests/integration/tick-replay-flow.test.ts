import { beforeEach, describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src/tick-engine";
import { handleReplayRoute } from "../../services/admin/src/routes/replay";
import { recordReplaySnapshot, resetReplayStore } from "../../services/admin/src/services/replay.service";
import { resetSessionService, setWorldState } from "../../services/api/src/services/session.service";

describe("tick replay flow", () => {
  beforeEach(() => {
    resetSessionService();
    resetReplayStore();
  });

  it("replays a stored historical tick input and returns matching checksum", () => {
    const world = createDefaultWorldState("replay_seed");
    setWorldState(world);
    const expected = advanceWorldTick(world, { seed: "replay_seed" });
    recordReplaySnapshot({
      tick_number: expected.tick_number,
      world_state: world,
      seed: "replay_seed",
      expected_checksum: expected.output_checksum
    });
    const response = handleReplayRoute({
      headers: { "x-admin-token": "openclaw_admin_local_token" },
      query: { tick: String(expected.tick_number), expected_checksum: expected.output_checksum }
    });
    expect(response.status).toBe(200);
    expect(response.body.ok).toBe(true);
    if (response.body.ok) {
      const data = response.body.data;
      if (!data) throw new Error("missing replay data");
      expect(data.matches).toBe(true);
    }
  });
});
