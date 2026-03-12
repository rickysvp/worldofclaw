import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("escort action", () => {
  it("marks the acting agent as escorting and updates trust/bond", () => {
    const world_state = createDefaultWorldState("escort_action_seed");
    world_state.registries.agents.agent_escort = {
      id: "agent_escort",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Escort",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 20,
      durability_max: 20,
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
    world_state.registries.agents.agent_client = {
      id: "agent_client",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Client",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 20,
      durability_max: 20,
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

    const result = advanceWorldTick(world_state, {
      seed: "escort_action_seed",
      action_queue: [
        {
          id: "action_escort_01",
          tick_number: 1,
          agent_id: "agent_escort",
          action_type: "escort",
          target_sector_id: null,
          target_agent_id: "agent_client",
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

    expect(result.resolved_actions[0]?.result_code).toBe("action_applied");
    expect(result.next_state.registries.agents.agent_escort?.status).toBe("escorting");
    expect(result.next_state.registries.agents.agent_escort?.trust).toBe(1);
    expect(result.next_state.registries.agents.agent_client?.bond).toBe(1);
  });
});
