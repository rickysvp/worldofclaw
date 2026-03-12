import { describe, expect, it } from "vitest";
import world_seed from "../../seed/world.seed.json";
import { advanceWorldTick, type ProcessedTickReceipt } from "../../packages/simulation/src";
import { validateWorldState } from "../../packages/schemas/src";

describe("tick idempotency", () => {
  it("does not apply the same world_id and tick_number twice", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const first = advanceWorldTick(parsed.data, {
      seed: "idempotent_seed"
    });

    const processed_receipts: Record<string, ProcessedTickReceipt> = {
      [first.idempotency_key]: first.receipt
    };

    const second = advanceWorldTick(parsed.data, {
      seed: "idempotent_seed",
      processed_receipts
    });

    expect(first.applied).toBe(true);
    expect(second.applied).toBe(false);
    expect(second.issues.some((issue) => issue.code === "tick_already_processed")).toBe(true);
  });

  it("persists processed receipts inside world state metadata", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const first = advanceWorldTick(parsed.data, {
      seed: "meta_receipt_seed"
    });

    expect(first.next_state.meta.processed_tick_receipts[first.idempotency_key]).toBeDefined();

    const replay_base = structuredClone(parsed.data);
    replay_base.meta.processed_tick_receipts = first.next_state.meta.processed_tick_receipts;
    const second = advanceWorldTick(replay_base, {
      seed: "meta_receipt_seed"
    });

    expect(second.applied).toBe(false);
    expect(second.issues.some((issue) => issue.code === "tick_already_processed")).toBe(true);
  });
});
