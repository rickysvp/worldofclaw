import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("world resource cycle", () => {
  it("refreshes sectors, decays volatile resources, and resolves salvage against sector stock", () => {
    const world_state = createDefaultWorldState("resource_cycle_seed");
    const sector = world_state.registries.sectors["sector_1_0"];
    if (!sector) {
      throw new Error("expected sector_1_0 to exist in default world state");
    }

    world_state.registries.agents.agent_cycle = {
      id: "agent_cycle",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Cycle Agent",
      location: "sector_1_0",
      status: "idle",
      power: 20,
      power_max: 20,
      durability: 20,
      durability_max: 20,
      compute: 4,
      compute_max: 4,
      cargo_used: 0,
      cargo_max: 20,
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
        flux: 1,
        xenite: 0,
        compute_core: 0,
        credits: 0
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    sector.resource_stock.scrap = 6;
    world_state.indexes.agent_ids = ["agent_cycle"];
    world_state.indexes.agents_by_location = { sector_1_0: ["agent_cycle"] };

    const result = advanceWorldTick(world_state, {
      seed: "resource_cycle_seed",
      action_queue: [
        {
          id: "action_salvage_cycle",
          tick_number: 1,
          agent_id: "agent_cycle",
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

    expect(result.applied).toBe(true);
    const next_agent = result.next_state.registries.agents["agent_cycle"];
    const next_sector = result.next_state.registries.sectors["sector_1_0"];

    expect(next_agent).toBeDefined();
    expect(next_sector).toBeDefined();
    expect(next_agent?.inventory.scrap).toBeGreaterThan(0);
    expect(next_sector?.resource_stock.scrap).toBeLessThan(6);
    expect(next_agent?.inventory.flux).toBe(0);
  });
});
