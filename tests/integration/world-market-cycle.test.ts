import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("world market cycle", () => {
  it("updates quotes on refresh and records trades through the tick pipeline", () => {
    const world_state = createDefaultWorldState("world_market_cycle_seed");
    world_state.registries.agents["agent_market_cycle"] = {
      id: "agent_market_cycle",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Cycle Trader",
      location: "sector_3_0",
      status: "idle",
      power: 20,
      power_max: 20,
      durability: 30,
      durability_max: 30,
      compute: 2,
      compute_max: 2,
      cargo_used: 0,
      cargo_max: 10,
      credits: 100,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: {
        power: 0,
        scrap: 0,
        composite: 0,
        circuit: 0,
        flux: 0,
        xenite: 0,
        compute_core: 0,
        credits: 100
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world_state.registries.sectors["sector_3_0"]!.resource_stock.flux = 0;
    world_state.registries.sectors["sector_3_0"]!.resource_regen.flux = 0;

    const first = advanceWorldTick(world_state, {
      seed: "world_market_cycle_seed"
    });

    const quote = first.next_state.registries.market_quotes["quote_sector_3_0_flux"];
    expect(quote).toBeDefined();
    if (!quote) {
      return;
    }

    const second = advanceWorldTick(first.next_state, {
      seed: "world_market_cycle_seed",
      action_queue: [
        {
          id: "action_market_flux_buy",
          tick_number: 2,
          agent_id: "agent_market_cycle",
          action_type: "trade",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: null,
          trade_side: "buy",
          trade_resource_type: "flux",
          trade_amount: 1,
          unit_price: quote.ask_price,
          build_facility_type: null,
          claim_target_kind: null,
          claim_target_id: null,
          preferred_resource_type: null
        }
      ]
    });

    expect(first.phase_outcomes.find((phase) => phase.phase === "resource_refresh")?.metadata.quote_change_count).toBeGreaterThan(0);
    expect(Object.keys(second.next_state.registries.market_trades).length).toBe(1);
    expect(second.next_state.indexes.market_trades_by_tick["2"]?.length).toBe(1);
    expect(second.next_state.registries.agents["agent_market_cycle"]?.inventory.flux).toBe(1);
  });
});
