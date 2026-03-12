import { describe, expect, it } from "vitest";
import world_seed from "../../seed/world.seed.json";
import { advanceWorldTick } from "../../packages/simulation/src";
import { validateWorldState } from "../../packages/schemas/src";

describe("tick seed replay", () => {
  it("replays with the same checksum for the same seed and input", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const action_queue = [
      {
        id: "action_salvage_replay",
        tick_number: 1,
        agent_id: "agent_scav_01",
        action_type: "salvage" as const,
        target_sector_id: null,
        facility_id: null,
        trade_side: null,
        trade_resource_type: null,
        trade_amount: 0,
        unit_price: 0
      }
    ];

    const first = advanceWorldTick(parsed.data, {
      seed: "replay_seed",
      action_queue
    });
    const second = advanceWorldTick(parsed.data, {
      seed: "replay_seed",
      action_queue
    });

    expect(first.checksum).toBe(second.checksum);
    expect(first.receipt.receipt_checksum).toBe(second.receipt.receipt_checksum);
  });
});
