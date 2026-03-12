import { describe, expect, it } from "vitest";
import world_seed from "../../seed/world.seed.json";
import { advanceWorldTick, type ProcessedTickReceipt } from "../../packages/simulation/src";
import { validateWorldState, type WorldState } from "../../packages/schemas/src";

describe("world tick smoke", () => {
  it("runs a small replayable tick range without database or services", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    let world_state: WorldState = parsed.data;
    const receipts: Record<string, ProcessedTickReceipt> = {};

    const first = advanceWorldTick(world_state, {
      seed: "smoke_seed",
      action_queue: [
        {
          id: "action_move_smoke",
          tick_number: 1,
          agent_id: "agent_scav_01",
          action_type: "move",
          target_sector_id: "sector_1_0",
          facility_id: null,
          trade_side: null,
          trade_resource_type: null,
          trade_amount: 0,
          unit_price: 0
        }
      ],
      processed_receipts: receipts
    });
    receipts[first.idempotency_key] = first.receipt;
    world_state = first.next_state;

    const second = advanceWorldTick(world_state, {
      seed: "smoke_seed",
      action_queue: [
        {
          id: "action_trade_smoke",
          tick_number: 2,
          agent_id: "agent_scav_01",
          action_type: "trade",
          target_sector_id: null,
          facility_id: null,
          trade_side: "sell",
          trade_resource_type: "scrap",
          trade_amount: 1,
          unit_price: 3
        }
      ],
      processed_receipts: receipts
    });

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(true);
    expect(second.next_state.meta.current_tick).toBe(2);
    expect(second.next_state.registries.events).not.toEqual({});
    expect(second.next_state.ledgers.entries.length).toBeGreaterThan(0);
  });
});
