import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { assignStarterSpawn, createStarterResources, createStarterStrategy } from "../../packages/onboarding/src";

describe("onboarding defaults", () => {
  it("creates the starter resource package", () => {
    expect(createStarterResources()).toEqual({
      power: 8,
      scrap: 2,
      composite: 0,
      circuit: 0,
      flux: 0,
      xenite: 0,
      compute_core: 0,
      credits: 10
    });
  });

  it("creates the starter strategy", () => {
    expect(createStarterStrategy()).toEqual({
      risk_level: "low",
      automation_mode: "conservative",
      market_mode: "npc_only",
      combat_mode: "avoid"
    });
  });

  it("assigns a starter spawn in a safe zone", () => {
    const world = createDefaultWorldState("onboarding_defaults_seed");
    const spawn = assignStarterSpawn(Object.values(world.registries.sectors));
    expect(spawn).toBeTruthy();
    expect(world.registries.sectors[spawn ?? ""]?.terrain_type).toBe("safe_zone");
  });
});
