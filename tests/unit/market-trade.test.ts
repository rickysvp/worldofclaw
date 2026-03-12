import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("market trade resolution", () => {
  it("executes buy trades against sector market quotes and records market order/trade rows", () => {
    const world_state = createDefaultWorldState("market_trade_seed");
    world_state.registries.agents["agent_market_buyer"] = {
      id: "agent_market_buyer",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Buyer",
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
      credits: 100,
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
        credits: 100
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };

    const quote = world_state.registries.market_quotes["quote_sector_0_0_scrap"];
    expect(quote).toBeDefined();
    if (!quote) {
      return;
    }

    const result = advanceWorldTick(world_state, {
      seed: "market_trade_seed",
      action_queue: [
        {
          id: "action_market_buy",
          tick_number: 1,
          agent_id: "agent_market_buyer",
          action_type: "trade",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: null,
          trade_side: "buy",
          trade_resource_type: "scrap",
          trade_amount: 2,
          unit_price: quote.ask_price + 5,
          build_facility_type: null,
          claim_target_kind: null,
          claim_target_id: null,
          preferred_resource_type: null
        }
      ]
    });

    expect(Object.keys(result.next_state.registries.market_orders).length).toBe(1);
    expect(Object.keys(result.next_state.registries.market_trades).length).toBe(1);
    expect(Number(result.resolved_actions[0]?.effects.executed_unit_price)).toBeGreaterThanOrEqual(quote.ask_price);
    expect(result.next_state.registries.agents["agent_market_buyer"]?.inventory.scrap).toBe(2);
  });

  it("rejects prices that are outside the local market quote", () => {
    const world_state = createDefaultWorldState("market_trade_reject_seed");
    world_state.registries.agents["agent_market_reject"] = {
      id: "agent_market_reject",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Rejector",
      location: "sector_0_0",
      status: "idle",
      power: 20,
      power_max: 20,
      durability: 30,
      durability_max: 30,
      compute: 2,
      compute_max: 2,
      cargo_used: 2,
      cargo_max: 10,
      credits: 0,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: {
        power: 0,
        scrap: 2,
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

    const quote = world_state.registries.market_quotes["quote_sector_0_0_scrap"];
    expect(quote).toBeDefined();
    if (!quote) {
      return;
    }

    const result = advanceWorldTick(world_state, {
      seed: "market_trade_reject_seed",
      action_queue: [
        {
          id: "action_market_sell_bad_price",
          tick_number: 1,
          agent_id: "agent_market_reject",
          action_type: "trade",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: null,
          trade_side: "sell",
          trade_resource_type: "scrap",
          trade_amount: 1,
          unit_price: 999,
          build_facility_type: null,
          claim_target_kind: null,
          claim_target_id: null,
          preferred_resource_type: null
        }
      ]
    });

    expect(result.resolved_actions[0]?.result_code).toBe("price_out_of_range");
    expect(Object.keys(result.next_state.registries.market_trades).length).toBe(0);
  });

  it("partially fills buy orders when credits only cover part of the requested quantity", () => {
    const world_state = createDefaultWorldState("market_trade_partial_seed");
    world_state.registries.agents["agent_market_partial"] = {
      id: "agent_market_partial",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Partial Buyer",
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
        credits: 8
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };

    const quote = world_state.registries.market_quotes["quote_sector_0_0_scrap"];
    expect(quote).toBeDefined();
    if (!quote) {
      return;
    }
    const one_unit_credits = quote.ask_price;
    const not_enough_for_two = Math.max(0, quote.ask_price - 1);
    world_state.registries.agents["agent_market_partial"].credits = one_unit_credits + not_enough_for_two;
    world_state.registries.agents["agent_market_partial"].inventory.credits = one_unit_credits + not_enough_for_two;

    const result = advanceWorldTick(world_state, {
      seed: "market_trade_partial_seed",
      action_queue: [
        {
          id: "action_market_buy_partial",
          tick_number: 1,
          agent_id: "agent_market_partial",
          action_type: "trade",
          target_sector_id: null,
          target_agent_id: null,
          facility_id: null,
          trade_side: "buy",
          trade_resource_type: "scrap",
          trade_amount: 3,
          unit_price: quote.ask_price + 5,
          build_facility_type: null,
          claim_target_kind: null,
          claim_target_id: null,
          preferred_resource_type: null
        }
      ]
    });

    expect(result.resolved_actions[0]?.result_code).toBe("action_applied");
    expect(Number(result.resolved_actions[0]?.effects.purchased_amount)).toBe(1);
    expect(result.next_state.registries.agents["agent_market_partial"]?.inventory.scrap).toBe(1);
  });
});
