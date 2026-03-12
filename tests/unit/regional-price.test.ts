import { describe, expect, it } from "vitest";
import { applyRegionalPrice, getRegionalPriceModifierPct } from "../../packages/economy/src";

describe("regional price", () => {
  it("applies safe zone and crater modifiers", () => {
    expect(getRegionalPriceModifierPct({ terrain_type: "safe_zone", resource_type: "scrap" })).toBe(110);
    expect(getRegionalPriceModifierPct({ terrain_type: "meteor_crater", resource_type: "flux" })).toBe(85);
  });

  it("applies relay service uplift", () => {
    expect(applyRegionalPrice(4, { terrain_type: "relay_highland", service_kind: "relay" })).toBe(5);
  });
});
