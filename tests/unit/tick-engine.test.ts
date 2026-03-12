import { describe, expect, it } from "vitest";
import world_seed from "../../seed/world.seed.json";
import { advanceWorldTick } from "../../packages/simulation/src";
import { validateWorldState } from "../../packages/schemas/src";

describe("tick engine", () => {
  it("advances current_tick and emits structured output", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const result = advanceWorldTick(parsed.data, {
      seed: "tick_engine_seed"
    });

    expect(result.applied).toBe(true);
    expect(result.next_state.meta.current_tick).toBe(1);
    expect(result.phase_trace).toEqual([
      "environment",
      "resource_refresh",
      "agent_upkeep",
      "action_resolution",
      "relation",
      "event_emission"
    ]);
    expect(result.ledger_count).toBeGreaterThan(0);
    expect(result.event_count).toBeGreaterThan(0);
  });

  it("generator refreshes power and upkeep deducts idle power", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const before_agent = parsed.data.registries.agents.agent_scav_01;
    const before_generator = parsed.data.registries.facilities.facility_generator_00;
    expect(before_agent).toBeTruthy();
    expect(before_generator).toBeTruthy();
    if (!before_agent || !before_generator) {
      return;
    }

    const before_agent_power = before_agent.power;
    const before_generator_power = before_generator.power_buffer;

    const result = advanceWorldTick(parsed.data, {
      seed: "tick_engine_seed"
    });

    const next_generator = result.next_state.registries.facilities.facility_generator_00;
    const next_agent = result.next_state.registries.agents.agent_scav_01;
    expect(next_generator).toBeTruthy();
    expect(next_agent).toBeTruthy();
    if (!next_generator || !next_agent) {
      return;
    }

    expect(next_generator.power_buffer).toBeGreaterThan(before_generator_power);
    expect(next_agent.power).toBeLessThan(before_agent_power);
  });

  it("resolves minimal action set with events and ledger writes", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const result = advanceWorldTick(parsed.data, {
      seed: "tick_action_seed",
      action_queue: [
        {
          id: "action_scan_01",
          tick_number: 1,
          agent_id: "agent_scav_01",
          action_type: "scan",
          target_sector_id: null,
          facility_id: null,
          trade_side: null,
          trade_resource_type: null,
          trade_amount: 0,
          unit_price: 0
        },
        {
          id: "action_salvage_01",
          tick_number: 1,
          agent_id: "agent_scav_01",
          action_type: "salvage",
          target_sector_id: null,
          facility_id: null,
          trade_side: null,
          trade_resource_type: null,
          trade_amount: 0,
          unit_price: 0
        }
      ]
    });

    expect(result.applied).toBe(true);
    const next_agent = result.next_state.registries.agents.agent_scav_01;
    expect(next_agent).toBeTruthy();
    if (!next_agent) {
      return;
    }

    expect(next_agent.inventory.scrap).toBeGreaterThan(4);
    expect(result.event_count).toBeGreaterThanOrEqual(2);
    expect(result.ledger_count).toBeGreaterThanOrEqual(2);
  });
});
