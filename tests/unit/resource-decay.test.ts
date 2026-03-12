import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { applyWorldResourceDecay } from "../../packages/simulation/src/resources/resource-decay";

describe("resource decay", () => {
  it("decays volatile flux on agents and facilities", () => {
    const world_state = createDefaultWorldState("resource_decay_seed");
    world_state.registries.agents.agent_test = {
      id: "agent_test",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Flux Runner",
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
        flux: 3,
        xenite: 0,
        compute_core: 0,
        credits: 0
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };

    world_state.registries.facilities.facility_test = {
      id: "facility_test",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "storage",
      status: "offline",
      access_policy: "restricted",
      public_use: false,
      level: 1,
      durability: 10,
      durability_max: 10,
      disabled_at_tick: null,
      claimed_at_tick: null,
      power_buffer: 2,
      power_capacity: 10,
      storage_capacity: 10,
      inventory: {
        power: 2,
        scrap: 0,
        composite: 0,
        circuit: 0,
        flux: 2,
        xenite: 0,
        compute_core: 0,
        credits: 0
      },
      linked_sector_ids: []
    };

    const next = applyWorldResourceDecay(world_state);
    const next_agent = next.registries.agents["agent_test"];
    const next_facility = next.registries.facilities["facility_test"];

    expect(next_agent).toBeDefined();
    expect(next_facility).toBeDefined();
    expect(next_agent?.inventory.flux).toBe(2);
    expect(next_facility?.inventory.flux).toBe(1);
    expect(next_facility?.power_buffer).toBe(1);
  });
});
