import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("world map and facility integration", () => {
  it("supports adjacency-based movement and facility coverage indexes in the same tick pipeline", () => {
    const world_state = createDefaultWorldState("world_map_facility_seed");
    world_state.registries.agents["agent_mapper"] = {
      id: "agent_mapper",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Mapper",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 10,
      durability_max: 10,
      compute: 2,
      compute_max: 2,
      cargo_used: 0,
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
    world_state.registries.facilities["facility_relay_01"] = {
      id: "facility_relay_01",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "relay",
      status: "online",
      access_policy: "public",
      public_use: true,
      level: 1,
      durability: 10,
      durability_max: 10,
      disabled_at_tick: null,
      claimed_at_tick: null,
      power_buffer: 0,
      power_capacity: 10,
      storage_capacity: 10,
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
      linked_sector_ids: []
    };

    const result = advanceWorldTick(world_state, {
      seed: "world_map_facility_seed",
      action_queue: [
        {
          id: "action_move_adjacent",
          tick_number: 1,
          agent_id: "agent_mapper",
          action_type: "move",
          target_sector_id: "sector_1_0",
          facility_id: null,
          trade_side: null,
          trade_resource_type: null,
          trade_amount: 0,
          unit_price: 0
        }
      ]
    });

    const next_agent = result.next_state.registries.agents["agent_mapper"];
    expect(result.applied).toBe(true);
    expect(next_agent?.location).toBe("sector_1_0");
    expect(result.next_state.indexes.facility_coverage_by_sector_id["sector_1_0"]).toContain("facility_relay_01");
  });
});
