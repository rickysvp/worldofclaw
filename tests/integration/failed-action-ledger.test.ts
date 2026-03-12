import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("failed action ledger", () => {
  it("does not create settlement ledgers for a failed move", () => {
    const world_state = createDefaultWorldState("failed_action_ledger_seed");
    world_state.registries.agents["agent_fail"] = {
      id: "agent_fail",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Fail Agent",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
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
    world_state.registries.sectors["sector_1_0"]!.blocked = true;

    const result = advanceWorldTick(world_state, {
      seed: "failed_action_ledger_seed",
      action_queue: [
        {
          id: "action_fail_move",
          tick_number: 1,
          agent_id: "agent_fail",
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

    expect(result.resolved_actions[0]?.status).toBe("failed");
    expect(result.resolved_actions[0]?.result_code).not.toBe("action_applied");
    expect(result.resolved_actions[0]?.ledger_ids.length ?? 0).toBeLessThanOrEqual(1);
  });
});
