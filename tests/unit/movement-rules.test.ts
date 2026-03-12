import { describe, expect, it } from "vitest";
import { canMoveBetweenSectors } from "../../packages/rules/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

describe("movement rules", () => {
  it("allows adjacent movement into open sectors", () => {
    const world = createDefaultWorldState("movement_seed");
    const result = canMoveBetweenSectors(
      world,
      world.registries.sectors["sector_0_0"]!,
      world.registries.sectors["sector_1_0"]!,
      null
    );
    expect(result).toEqual({ allowed: true, error_code: null });
  });

  it("denies movement into restricted sectors for non-controller", () => {
    const world = createDefaultWorldState("movement_restricted_seed");
    world.registries.sectors["sector_1_0"]!.access_policy = "restricted";
    world.registries.sectors["sector_1_0"]!.controller_owner_user_id = "user_alpha";
    const result = canMoveBetweenSectors(
      world,
      world.registries.sectors["sector_0_0"]!,
      world.registries.sectors["sector_1_0"]!,
      "user_beta"
    );
    expect(result.allowed).toBe(false);
    expect(result.error_code).toBe("access_denied");
  });
});
