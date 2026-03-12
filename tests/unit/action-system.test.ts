import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("action system", () => {
  it("mines meteor resources from crater sectors", () => {
    const world_state = createDefaultWorldState("mine_meteor_seed");
    world_state.registries.agents["agent_miner"] = {
      id: "agent_miner",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Miner",
      location: "sector_3_0",
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
    world_state.registries.sectors["sector_3_0"]!.resource_stock.flux = 2;

    const result = advanceWorldTick(world_state, {
      seed: "mine_meteor_seed",
      action_queue: [
        {
          id: "action_mine_01",
          tick_number: 1,
          agent_id: "agent_miner",
          action_type: "mine_meteor",
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
          preferred_resource_type: "flux"
        }
      ]
    });

    const next_agent = result.next_state.registries.agents["agent_miner"];
    expect(next_agent?.inventory.flux).toBe(1);
    expect(result.resolved_actions[0]?.result_code).toBe("action_applied");
  });

  it("builds facilities and records sector claims", () => {
    const world_state = createDefaultWorldState("build_claim_seed");
    world_state.registries.agents["agent_builder"] = {
      id: "agent_builder",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: "user_builder",
      external_agent_id: null,
      name: "Builder",
      location: "sector_0_0",
      status: "idle",
      power: 20,
      power_max: 20,
      durability: 30,
      durability_max: 30,
      compute: 2,
      compute_max: 2,
      cargo_used: 6,
      cargo_max: 20,
      credits: 0,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: {
        power: 0,
        scrap: 6,
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

    const built = advanceWorldTick(world_state, {
      seed: "build_claim_seed",
      action_queue: [
        {
          id: "action_build_01",
          tick_number: 1,
          agent_id: "agent_builder",
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

    const claimed = advanceWorldTick(built.next_state, {
      seed: "build_claim_seed",
      action_queue: [
        {
          id: "action_claim_01",
          tick_number: 2,
          agent_id: "agent_builder",
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
        }
      ]
    });

    expect(Object.keys(built.next_state.registries.facilities).some((id) => id.startsWith("facility_workshop_"))).toBe(true);
    expect(claimed.next_state.registries.sectors["sector_0_0"]?.controlling_contract_id).toContain("contract_claim_");
  });

  it("attacks agents in the same sector and can disable the target", () => {
    const world_state = createDefaultWorldState("attack_seed");
    world_state.registries.agents["agent_attacker"] = {
      id: "agent_attacker",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Attacker",
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
        flux: 0,
        xenite: 0,
        compute_core: 0,
        credits: 0
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world_state.registries.agents["agent_target"] = {
      id: "agent_target",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Target",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 3,
      durability_max: 3,
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
      seed: "attack_seed",
      action_queue: [
        {
          id: "action_attack_01",
          tick_number: 1,
          agent_id: "agent_attacker",
          action_type: "attack",
          target_sector_id: null,
          target_agent_id: "agent_target",
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

    expect(result.next_state.registries.agents["agent_target"]?.status).toBe("disabled");
    expect(result.resolved_actions[0]?.result_code).toBe("action_applied");
  });
});
