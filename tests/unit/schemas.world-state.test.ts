import { describe, expect, it } from "vitest";
import world_seed from "../../seed/world.seed.json";
import {
  createDefaultWorldState,
  validateWorldState,
  world_state_schema
} from "../../packages/schemas/src";

describe("world state schema", () => {
  it("creates a valid default world state", () => {
    const state = createDefaultWorldState("seed_alpha");
    const parsed = world_state_schema.parse(state);

    expect(parsed.meta.seed).toBe("seed_alpha");
    expect(parsed.meta.processed_tick_receipts).toEqual({});
    expect(parsed.indexes.sector_ids).toHaveLength(25);
    expect(parsed.indexes.sectors_by_coordinate["0,0"]).toBe("sector_0_0");
    expect(parsed.indexes.neighbor_sector_ids["sector_0_0"]).toEqual(["sector_1_0", "sector_0_1"]);
  });

  it("validates world.seed.json", () => {
    const result = validateWorldState(world_seed);

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.meta.world_name).toBe("OpenClaw Agent World");
      expect(result.data.indexes.agent_ids).toContain("agent_scav_01");
      expect(result.data.indexes.facility_ids).toContain("facility_generator_00");
    }
  });

  it("returns structured errors for invalid world state", () => {
    const invalid = createDefaultWorldState();
    invalid.registries.agents.agent_invalid = {
      id: "agent_invalid",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Invalid",
      location: "sector_0_0",
      status: "idle",
      power: 1,
      power_max: 1,
      durability: 1,
      durability_max: 1,
      compute: 1,
      compute_max: 1,
      cargo_used: 0,
      cargo_max: 1,
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

    const result = validateWorldState(invalid);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((issue) => issue.path === "indexes.agent_ids")).toBe(true);
    }
  });

  it("detects registry and index mismatches", () => {
    const state = createDefaultWorldState();
    state.indexes.sectors_by_coordinate["0,0"] = "sector_0_1";

    const result = validateWorldState(state);
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors.some((issue) => issue.path === "indexes.sectors_by_coordinate.0,0")).toBe(true);
    }
  });
});
