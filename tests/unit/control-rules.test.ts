import { describe, expect, it } from "vitest";
import { deriveSectorControlSummary } from "../../packages/rules/src";
import { createDefaultWorldState, type Facility, type WorldEvent } from "../../packages/schemas/src";

const makeFacility = (id: string, ownerUserId: string | null): Facility => ({
  id,
  version: 1,
  created_at_tick: 0,
  updated_at_tick: 0,
  owner_user_id: ownerUserId,
  owner_agent_id: null,
  operator_agent_id: null,
  sector_id: "sector_2_2",
  facility_type: "storage",
  status: "online",
  access_policy: "restricted",
  public_use: false,
  level: 1,
  durability: 10,
  durability_max: 10,
  disabled_at_tick: null,
  claimed_at_tick: null,
  power_buffer: 0,
  power_capacity: 10,
  storage_capacity: 10,
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
  linked_sector_ids: []
});

describe("control rules", () => {
  it("marks sectors contested after repeated hostile conflicts", () => {
    const world = createDefaultWorldState("control_contested_seed");
    const sector = world.registries.sectors["sector_2_2"]!;
    const events: WorldEvent[] = [1, 3, 5].map((tick, index) => ({
      id: `event_attack_${index}`,
      version: 1,
      created_at_tick: tick,
      updated_at_tick: tick,
      tick,
      kind: "agent",
      level: "warn",
      action: "attack",
      source_entity_id: "agent_a",
      target_entity_id: "agent_b",
      sector_id: sector.id,
      title: "attack",
      message: "hostile clash",
      error_code: null,
      payload: {}
    }));

    const summary = deriveSectorControlSummary(sector, [makeFacility("f1", "user_a")], events, 6);
    expect(summary.control_state).toBe("contested");
    expect(summary.access_policy).toBe("restricted");
  });

  it("marks sector controlled after majority ownership is held long enough", () => {
    const world = createDefaultWorldState("control_held_seed");
    const sector = world.registries.sectors["sector_2_2"]!;
    sector.controller_owner_user_id = "user_a";
    sector.control_since_tick = 0;
    const facilities = [makeFacility("f1", "user_a"), makeFacility("f2", "user_a"), makeFacility("f3", "user_b")];
    const summary = deriveSectorControlSummary(sector, facilities, [], 12);
    expect(summary.control_state).toBe("controlled");
    expect(summary.controller_owner_user_id).toBe("user_a");
  });
});
