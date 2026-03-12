import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("world action flow", () => {
  it("supports build -> claim -> move as a deterministic action chain", () => {
    const world_state = createDefaultWorldState("world_action_flow_seed");
    world_state.registries.agents["agent_flow"] = {
      id: "agent_flow",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Flow Agent",
      location: "sector_0_0",
      status: "idle",
      power: 20,
      power_max: 20,
      durability: 30,
      durability_max: 30,
      compute: 2,
      compute_max: 2,
      cargo_used: 4,
      cargo_max: 10,
      credits: 0,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: {
        power: 0,
        scrap: 4,
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
    const first = advanceWorldTick(world_state, {
      seed: "world_action_flow_seed",
      action_queue: [
        {
          id: "action_build_flow",
          tick_number: 1,
          agent_id: "agent_flow",
          action_type: "build",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: null,
          trade_side: null,
          trade_resource_type: null,
          trade_amount: 0,
          unit_price: 0,
          build_facility_type: "workshop",
          claim_target_kind: null,
          claim_target_id: null,
          preferred_resource_type: null
        }
      ]
    });

    const second = advanceWorldTick(first.next_state, {
      seed: "world_action_flow_seed",
      action_queue: [
        {
          id: "action_claim_flow",
          tick_number: 2,
          agent_id: "agent_flow",
          action_type: "claim",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: null,
          trade_side: null,
          trade_resource_type: null,
          trade_amount: 0,
          unit_price: 0,
          build_facility_type: null,
          claim_target_kind: "sector",
          claim_target_id: "sector_0_0",
          preferred_resource_type: null
        },
        {
          id: "action_move_flow",
          tick_number: 2,
          agent_id: "agent_flow",
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

    const next_agent = second.next_state.registries.agents["agent_flow"];
    expect(first.resolved_actions[0]?.result_code).toBe("action_applied");
    expect(second.resolved_actions.every((action) => action.result_code === "action_applied")).toBe(true);
    expect(second.next_state.registries.sectors["sector_0_0"]?.controlling_contract_id).toContain("contract_claim_");
    expect(Object.keys(first.next_state.registries.facilities).some((id) => id.startsWith("facility_workshop_"))).toBe(true);
    expect(next_agent?.location).toBe("sector_1_0");
  });
});
