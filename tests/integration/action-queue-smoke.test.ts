import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("action queue smoke", () => {
  it("executes queued actions sequentially for a single agent", () => {
    const world_state = createDefaultWorldState("action_queue_smoke_seed");
    world_state.registries.agents["agent_queue"] = {
      id: "agent_queue",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Queue Agent",
      location: "sector_0_0",
      status: "idle",
      power: 20,
      power_max: 20,
      durability: 30,
      durability_max: 30,
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
    world_state.registries.sectors["sector_0_0"]!.resource_stock.scrap = 3;

    const result = advanceWorldTick(world_state, {
      seed: "action_queue_smoke_seed",
      action_queue: [
        {
          id: "action_queue_move",
          tick_number: 1,
          agent_id: "agent_queue",
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
        },
        {
          id: "action_queue_scan",
          tick_number: 1,
          agent_id: "agent_queue",
          action_type: "scan",
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
        }
      ]
    });

    expect(result.resolved_actions).toHaveLength(2);
    expect(result.resolved_actions[0]?.status).toBe("succeeded");
    expect(result.resolved_actions[1]?.status).toBe("succeeded");
  });
});
