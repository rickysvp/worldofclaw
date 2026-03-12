import { describe, expect, it } from "vitest";
import { canApplyCreditsDelta, canApplySettlementPostings } from "../../packages/economy/src";
import { createDefaultWorldState as createWorld } from "../../packages/schemas/src";

describe("balance overdraft", () => {
  it("rejects overdrafts for virtual market accounts", () => {
    const world_state = createWorld("overdraft_seed");
    world_state.ledgers.credits_balances_by_entity.npc_market_sector_0_0 = 1;
    expect(canApplyCreditsDelta(world_state, "npc_market_sector_0_0", -2)).toBe(false);
    expect(
      canApplySettlementPostings(world_state, [
        { entity_id: "npc_market_sector_0_0", credits_delta: -2 },
        { entity_id: "agent_a", credits_delta: 1 },
        { entity_id: "platform_treasury", credits_delta: 1 }
      ])
    ).toBe(false);
  });
});
