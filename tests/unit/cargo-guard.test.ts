import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("cargo guards", () => {
  it("limits salvage by remaining cargo capacity", () => {
    const world_state = createDefaultWorldState("cargo_guard_seed");
    world_state.registries.agents["agent_cargo"] = {
      id: "agent_cargo",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Cargo Clamp",
      location: "sector_1_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 10,
      durability_max: 10,
      compute: 2,
      compute_max: 2,
      cargo_used: 9,
      cargo_max: 10,
      credits: 0,
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
        credits: 0
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world_state.registries.sectors["sector_1_0"]!.resource_stock.scrap = 6;

    const result = advanceWorldTick(world_state, {
      seed: "cargo_guard_seed",
      action_queue: [
        {
          id: "action_salvage_cargo",
          tick_number: 1,
          agent_id: "agent_cargo",
          action_type: "salvage",
          target_sector_id: null,
          facility_id: null,
          trade_side: null,
          trade_resource_type: null,
          trade_amount: 0,
          unit_price: 0
        }
      ]
    });

    const next_agent = result.next_state.registries.agents["agent_cargo"];
    expect(next_agent).toBeDefined();
    expect(next_agent?.cargo_used).toBe(10);
    expect(next_agent?.inventory.scrap).toBe(1);
  });

  it("limits trade buys by remaining cargo capacity", () => {
    const world_state = createDefaultWorldState("cargo_trade_seed");
    world_state.registries.agents["agent_buyer"] = {
      id: "agent_buyer",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Buyer",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 10,
      durability_max: 10,
      compute: 2,
      compute_max: 2,
      cargo_used: 4,
      cargo_max: 5,
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

    const quote = world_state.registries.market_quotes["quote_sector_0_0_scrap"];
    expect(quote).toBeDefined();
    if (!quote) {
      return;
    }

    const result = advanceWorldTick(world_state, {
      seed: "cargo_trade_seed",
      action_queue: [
        {
          id: "action_trade_buy_cargo",
          tick_number: 1,
          agent_id: "agent_buyer",
          action_type: "trade",
          target_sector_id: null,
          facility_id: null,
          trade_side: "buy",
          trade_resource_type: "scrap",
          trade_amount: 3,
          unit_price: quote.ask_price + 5
        }
      ]
    });

    const next_agent = result.next_state.registries.agents["agent_buyer"];
    const executed_unit_price = Number(result.resolved_actions[0]?.effects.executed_unit_price ?? 0);
    expect(next_agent).toBeDefined();
    expect(next_agent?.inventory.scrap).toBe(1);
    expect(next_agent?.cargo_used).toBe(5);
    expect(next_agent?.credits).toBe(100 - executed_unit_price);
  });
});
