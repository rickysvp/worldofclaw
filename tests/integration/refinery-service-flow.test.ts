import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("refinery service flow", () => {
  it("charges refinery service credits and produces compute_core on success", () => {
    const world_state = createDefaultWorldState("refinery_service_seed");
    world_state.registries.agents.agent_refine = {
      id: "agent_refine",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Refiner",
      location: "sector_0_0",
      status: "idle",
      power: 5,
      power_max: 10,
      durability: 10,
      durability_max: 10,
      compute: 1,
      compute_max: 1,
      cargo_used: 3,
      cargo_max: 10,
      credits: 10,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: { power: 0, scrap: 0, composite: 0, circuit: 1, flux: 0, xenite: 2, compute_core: 0, credits: 10 },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world_state.registries.facilities.facility_refinery = {
      id: "facility_refinery",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: "owner_refinery",
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "refinery",
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
      inventory: { power: 0, scrap: 0, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 },
      linked_sector_ids: []
    };

    const result = advanceWorldTick(world_state, {
      seed: "refinery_service_seed",
      action_queue: [{
        id: "action_refine_service",
        tick_number: 1,
        agent_id: "agent_refine",
        action_type: "refine",
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

    expect(result.resolved_actions[0]?.result_code).toBe("action_applied");
    expect(Number(result.resolved_actions[0]?.effects.service_price)).toBe(5);
    expect(result.next_state.ledgers.credits_balances_by_entity.platform_treasury).toBeGreaterThan(0);
    expect(result.next_state.ledgers.credits_balances_by_entity.owner_refinery).toBeGreaterThan(0);
    expect(result.next_state.registries.facilities.facility_refinery?.inventory.credits).toBe(0);
  });
});
