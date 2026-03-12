import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("charge ledger", () => {
  it("transfers charge credits to the facility instead of destroying them", () => {
    const world_state = createDefaultWorldState("charge_ledger_seed");
    world_state.registries.agents.agent_charge = {
      id: "agent_charge",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Charger",
      location: "sector_0_0",
      status: "idle",
      power: 0,
      power_max: 10,
      durability: 20,
      durability_max: 20,
      compute: 2,
      compute_max: 2,
      cargo_used: 0,
      cargo_max: 10,
      credits: 5,
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
        credits: 5
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world_state.registries.facilities.facility_charge = {
      id: "facility_charge",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "generator",
      status: "online",
      access_policy: "public",
      public_use: true,
      level: 1,
      durability: 20,
      durability_max: 20,
      disabled_at_tick: null,
      claimed_at_tick: null,
      power_buffer: 4,
      power_capacity: 20,
      storage_capacity: 10,
      inventory: {
        power: 4,
        scrap: 0,
        composite: 0,
        circuit: 0,
        flux: 0,
        xenite: 0,
        compute_core: 0,
        credits: 0
      },
      linked_sector_ids: []
    };

    const total_credits_before =
      world_state.registries.agents.agent_charge.credits +
      world_state.registries.facilities.facility_charge.inventory.credits +
      (world_state.ledgers.credits_balances_by_entity.platform_treasury ?? 0);

    const result = advanceWorldTick(world_state, {
      seed: "charge_ledger_seed",
      action_queue: [
        {
          id: "action_charge_ledger",
          tick_number: 1,
          agent_id: "agent_charge",
          action_type: "charge",
          facility_id: "facility_charge",
          target_sector_id: null,
          target_agent_id: null,
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

    const next_agent = result.next_state.registries.agents.agent_charge;
    const next_facility = result.next_state.registries.facilities.facility_charge;
    const total_credits_after =
      (next_agent?.credits ?? 0) +
      (next_facility?.inventory.credits ?? 0) +
      (result.next_state.ledgers.credits_balances_by_entity.platform_treasury ?? 0);

    expect(result.resolved_actions[0]?.result_code).toBe("action_applied");
    expect(next_agent?.credits).toBe(2);
    expect(next_facility?.inventory.credits).toBe(0);
    expect(result.next_state.ledgers.credits_balances_by_entity.platform_treasury).toBe(3);
    expect(total_credits_after).toBe(total_credits_before);
    expect(
      result.next_state.ledgers.entries.filter((entry) => entry.action_ref === "action_charge_ledger" && entry.resource_type === null).map((entry) => entry.credits_delta)
    ).toContain(-3);
  });
});
