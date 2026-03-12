import { describe, expect, it } from "vitest";
import world_seed from "../../seed/world.seed.json";
import { advanceWorldTick } from "../../packages/simulation/src";
import { validateWorldState } from "../../packages/schemas/src";

describe("ledger synchronization", () => {
  it("keeps ledger mirrors aligned with agent state after tick mutations", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const result = advanceWorldTick(parsed.data, {
      seed: "ledger_sync_seed",
      action_queue: [
        {
          id: "action_trade_sell_sync",
          tick_number: 1,
          agent_id: "agent_scav_01",
          action_type: "trade",
          target_sector_id: null,
          facility_id: null,
          trade_side: "sell",
          trade_resource_type: "scrap",
          trade_amount: 1,
          unit_price: 2
        }
      ]
    });

    const next_agent = result.next_state.registries.agents["agent_scav_01"];
    expect(next_agent).toBeDefined();
    if (!next_agent) {
      return;
    }

    expect(result.next_state.ledgers.resource_balances_by_entity["agent_scav_01"]?.power).toBe(next_agent.power);
    expect(result.next_state.ledgers.resource_balances_by_entity["agent_scav_01"]?.scrap).toBe(next_agent.inventory.scrap);
    expect(result.next_state.ledgers.credits_balances_by_entity["agent_scav_01"]).toBe(next_agent.credits);
  });
});
