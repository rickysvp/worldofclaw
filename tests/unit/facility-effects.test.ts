import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("facility effects", () => {
  it("shelter coverage prevents extra night power loss and defense coverage suppresses threat gain", () => {
    const world_state = createDefaultWorldState("facility_effect_seed");
    world_state.meta.current_tick = 71;
    world_state.registries.agents["agent_facility"] = {
      id: "agent_facility",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Covered Agent",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 50,
      durability_max: 50,
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
    world_state.registries.sectors["sector_0_0"]!.resource_stock.scrap = 4;
    world_state.registries.facilities["facility_shelter_01"] = {
      id: "facility_shelter_01",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "shelter",
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
    world_state.registries.facilities["facility_defense_01"] = {
      id: "facility_defense_01",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "defense_node",
      status: "online",
      access_policy: "restricted",
      public_use: false,
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
      seed: "facility_effect_seed",
      action_queue: [
        {
          id: "action_salvage_facility",
          tick_number: 72,
          agent_id: "agent_facility",
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

    const next_agent = result.next_state.registries.agents["agent_facility"];
    expect(next_agent).toBeDefined();
    expect(next_agent?.power).toBe(8);
    expect(next_agent?.threat).toBe(0);
    expect(result.next_state.indexes.facility_coverage_by_sector_id["sector_0_0"]).toEqual(
      expect.arrayContaining(["facility_shelter_01", "facility_defense_01"])
    );
  });
});
