import { describe, expect, it } from "vitest";
import { getDefaultSectorAccessPolicy, getSectorFacilitySlotCount, hasAvailableFacilitySlot, isSectorBlocked } from "../../packages/rules/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

describe("sector rules", () => {
  it("uses safe zone defaults and slot limits", () => {
    const sector = createDefaultWorldState("sector_rules_seed").registries.sectors["sector_0_0"]!;
    expect(getDefaultSectorAccessPolicy(sector)).toBe("open");
    expect(getSectorFacilitySlotCount(sector)).toBeGreaterThanOrEqual(1);
    expect(hasAvailableFacilitySlot(sector)).toBe(true);
  });

  it("recognizes blocked sectors", () => {
    const world = createDefaultWorldState("sector_rules_blocked_seed");
    world.registries.sectors["sector_1_0"]!.blocked = true;
    expect(isSectorBlocked(world.registries.sectors["sector_1_0"]!)).toBe(true);
  });
});
