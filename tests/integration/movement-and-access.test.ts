import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("movement and access integration", () => {
  it("blocks movement into restricted controlled sectors for outsiders", () => {
    const world = createDefaultWorldState("movement_access_seed");
    world.registries.agents["agent_move_test"] = {
      id: "agent_move_test",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: "user_beta",
      external_agent_id: null,
      name: "Scout",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 10,
      durability_max: 10,
      compute: 1,
      compute_max: 1,
      cargo_used: 0,
      cargo_max: 10,
      credits: 0,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: { power: 0, scrap: 0, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world.registries.sectors["sector_1_0"]!.access_policy = "restricted";
    world.registries.sectors["sector_1_0"]!.controller_owner_user_id = "user_alpha";

    const result = advanceWorldTick(world, {
      seed: "movement_access_seed",
      action_queue: [
        {
          id: "action_move_restricted",
          tick_number: 1,
          agent_id: "agent_move_test",
          action_type: "move",
          target_sector_id: "sector_1_0",
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
        }
      ]
    });

    expect(result.resolved_actions[0]?.success).toBe(false);
    expect(result.resolved_actions[0]?.result_code).toBe("access_denied");
  });
});
