import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("service owner split", () => {
  it("credits the facility owner entity for player-owned repair services", () => {
    const world_state = createDefaultWorldState("owner_split_seed");
    world_state.registries.agents.agent_repair_owner = {
      id: "agent_repair_owner",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Repairer",
      location: "sector_0_0",
      status: "idle",
      power: 5,
      power_max: 10,
      durability: 5,
      durability_max: 20,
      compute: 1,
      compute_max: 1,
      cargo_used: 1,
      cargo_max: 10,
      credits: 10,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: { power: 0, scrap: 1, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 10 },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world_state.registries.facilities.facility_owner_workshop = {
      id: "facility_owner_workshop",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: "user_owner_split",
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "workshop",
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
      seed: "owner_split_seed",
      action_queue: [{
        id: "action_repair_owner_split",
        tick_number: 1,
        agent_id: "agent_repair_owner",
        action_type: "repair",
        target_sector_id: null,
        target_agent_id: null,
        facility_id: "facility_owner_workshop",
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

    expect(result.next_state.ledgers.credits_balances_by_entity.user_owner_split).toBeGreaterThan(0);
    expect(result.next_state.registries.facilities.facility_owner_workshop?.inventory.credits).toBe(0);
  });
});
