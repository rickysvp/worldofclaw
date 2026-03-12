import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("sector control flow", () => {
  it("promotes long-held majority ownership into controlled state", () => {
    const world = createDefaultWorldState("sector_control_flow_seed");
    world.meta.current_tick = 12;
    world.registries.sectors["sector_1_1"]!.controller_owner_user_id = "user_alpha";
    world.registries.sectors["sector_1_1"]!.control_since_tick = 0;
    world.registries.facilities["facility_control_a"] = {
      id: "facility_control_a",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: "user_alpha",
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_1_1",
      facility_type: "storage",
      status: "online",
      access_policy: "restricted",
      public_use: false,
      level: 1,
      durability: 10,
      durability_max: 10,
      disabled_at_tick: null,
      claimed_at_tick: 0,
      power_buffer: 0,
      power_capacity: 10,
      storage_capacity: 10,
      inventory: { power: 0, scrap: 0, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 },
      linked_sector_ids: []
    };
    world.registries.facilities["facility_control_b"] = {
      ...world.registries.facilities["facility_control_a"],
      id: "facility_control_b"
    };

    const result = advanceWorldTick(world, { seed: "sector_control_flow_seed" });
    expect(result.next_state.registries.sectors["sector_1_1"]?.control_state).toBe("controlled");
    expect(result.next_state.registries.sectors["sector_1_1"]?.controller_owner_user_id).toBe("user_alpha");
  });
});
