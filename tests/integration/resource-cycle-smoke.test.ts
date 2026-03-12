import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("resource cycle smoke", () => {
  it("cycles salvage, passive decay, and generator production without breaking state", () => {
    const world = createDefaultWorldState("resource_cycle_smoke_seed");
    world.registries.agents["agent_resource_smoke"] = {
      id: "agent_resource_smoke",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Smoker",
      location: "sector_1_0",
      status: "idle",
      power: 20,
      power_max: 20,
      durability: 60,
      durability_max: 60,
      compute: 2,
      compute_max: 2,
      cargo_used: 0,
      cargo_max: 20,
      credits: 0,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: { power: 0, scrap: 0, composite: 0, circuit: 0, flux: 1, xenite: 0, compute_core: 0, credits: 0 },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world.registries.facilities["facility_gen_smoke"] = {
      id: "facility_gen_smoke",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_1_0",
      facility_type: "generator",
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
      inventory: { power: 0, scrap: 1, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 },
      linked_sector_ids: []
    };
    world.registries.sectors["sector_1_0"]!.resource_stock.scrap = 6;

    const result = advanceWorldTick(world, {
      seed: "resource_cycle_smoke_seed",
      action_queue: [{
        id: "action_salvage_resource_smoke",
        tick_number: 1,
        agent_id: "agent_resource_smoke",
        action_type: "salvage",
        target_sector_id: null,
        target_agent_id: null,
        facility_id: null,
        trade_side: null,
        trade_resource_type: null,
        trade_amount: 0,
        unit_price: 0,
        build_facility_type: null,
        claim_target_kind: null,
        claim_target_id: null,
        preferred_resource_type: null
      }]
    });

    expect(result.next_state.registries.agents["agent_resource_smoke"]?.inventory.scrap).toBeGreaterThan(0);
    expect(result.next_state.registries.facilities["facility_gen_smoke"]?.power_buffer).toBe(2);
    expect(result.next_state.registries.agents["agent_resource_smoke"]?.inventory.flux).toBe(0);
  });
});
