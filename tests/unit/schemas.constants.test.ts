import { describe, expect, it } from "vitest";
import {
  action_values,
  facility_values,
  resource_enum,
  resource_values,
  terrain_values,
  world_constants
} from "../../packages/schemas/src";

describe("schema constants", () => {
  it("exports the required world constants", () => {
    expect(world_constants.tick_duration_seconds).toBe(600);
    expect(world_constants.map_width).toBe(5);
    expect(world_constants.map_height).toBe(5);
    expect(world_constants.day_length_ticks).toBe(144);
    expect(world_constants.newbie_safe_ticks).toBe(6);
    expect(world_constants.meteor_min_interval).toBe(12);
    expect(world_constants.meteor_max_interval).toBe(24);
  });

  it("contains the required enum values", () => {
    expect(resource_values).toEqual([
      "power",
      "scrap",
      "composite",
      "circuit",
      "flux",
      "xenite",
      "compute_core",
      "credits"
    ]);
    expect(terrain_values).toContain("safe_zone");
    expect(terrain_values).toContain("relay_highland");
    expect(facility_values).toContain("generator");
    expect(facility_values).toContain("defense_node");
    expect(action_values).toContain("move");
    expect(action_values).toContain("claim");
  });

  it("uses zod enums for resource parsing", () => {
    expect(resource_enum.parse("power")).toBe("power");
    expect(() => resource_enum.parse("invalid")).toThrow();
  });
});
