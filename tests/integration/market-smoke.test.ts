import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("market smoke", () => {
  it("sells scrap to the npc market and records settlement fields", () => {
    const world_state = createDefaultWorldState("market_smoke_seed");
    world_state.registries.agents.agent_seller = {
      id: "agent_seller",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Seller",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 10,
      durability_max: 10,
      compute: 1,
      compute_max: 1,
      cargo_used: 2,
      cargo_max: 10,
      credits: 0,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: { power: 0, scrap: 2, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };

    const quote = world_state.registries.market_quotes.quote_sector_0_0_scrap!;
    const result = advanceWorldTick(world_state, {
      seed: "market_smoke_seed",
      action_queue: [{
        id: "action_market_smoke",
        tick_number: 1,
        agent_id: "agent_seller",
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
      }]
    });

    const trade = Object.values(result.next_state.registries.market_trades)[0];
    expect(trade?.platform_cut).toBeGreaterThan(0);
    expect(trade?.payer).toContain("npc_market");
    expect(result.next_state.registries.agents.agent_seller?.credits).toBeGreaterThan(0);
  });
});
