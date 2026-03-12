import { describe, expect, it } from "vitest";
import { canPlaceFacilityInSector } from "../../packages/rules/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

describe("facility placement rules", () => {
  it("allows valid facility placement on supported terrain with access", () => {
    const world = createDefaultWorldState("facility_placement_seed");
    const sector = world.registries.sectors["sector_0_0"]!;
    const result = canPlaceFacilityInSector(sector, [], "generator", true);
    expect(result).toEqual({ allowed: true, error_code: null });
  });

  it("rejects placement when slots are full", () => {
    const world = createDefaultWorldState("facility_placement_full_seed");
    const sector = world.registries.sectors["sector_0_0"]!;
    sector.facility_ids = ["a", "b", "c"];
    sector.facility_slot_count = 3;
    const result = canPlaceFacilityInSector(sector, [], "generator", true);
    expect(result.allowed).toBe(false);
    expect(result.error_code).toBe("slot_occupied");
  });
});
