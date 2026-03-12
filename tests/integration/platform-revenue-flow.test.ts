import { describe, expect, it } from "vitest";
import { summarizeTreasuryFromLedger } from "../../packages/economy/src";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("platform revenue flow", () => {
  it("aggregates platform revenue from trade and services", () => {
    const world_state = createDefaultWorldState("platform_revenue_seed");
    world_state.registries.agents.agent_rev = {
      id: "agent_rev",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Revenue Agent",
      location: "sector_0_0",
      status: "idle",
      power: 0,
      power_max: 10,
      durability: 10,
      durability_max: 20,
      compute: 1,
      compute_max: 1,
      cargo_used: 2,
      cargo_max: 10,
      credits: 10,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: { power: 0, scrap: 2, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 10 },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    world_state.registries.facilities.facility_rev = {
      id: "facility_rev",
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
      durability: 10,
      durability_max: 10,
      disabled_at_tick: null,
      claimed_at_tick: null,
      power_buffer: 4,
      power_capacity: 10,
      storage_capacity: 10,
      inventory: { power: 4, scrap: 0, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 },
      linked_sector_ids: []
    };

    const quote = world_state.registries.market_quotes.quote_sector_0_0_scrap!;
    const result = advanceWorldTick(world_state, {
      seed: "platform_revenue_seed",
      action_queue: [
        {
          id: "action_trade_rev",
          tick_number: 1,
          agent_id: "agent_rev",
          action_type: "trade",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: null,
          trade_side: "sell",
          trade_resource_type: "scrap",
          trade_amount: 1,
          unit_price: quote.bid_price,
          build_facility_type: null,
          claim_target_kind: null,
          claim_target_id: null,
          preferred_resource_type: null
        },
        {
          id: "action_charge_rev",
          tick_number: 1,
          agent_id: "agent_rev",
          action_type: "charge",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: "facility_rev",
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

    const summary = summarizeTreasuryFromLedger(result.next_state.ledgers.entries);
    expect(summary.total_revenue).toBeGreaterThan(0);
    expect(Object.keys(summary.by_reason)).toContain("npc_trade");
    expect(Object.keys(summary.by_reason)).toContain("charge_service");
  });
});
