import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { refreshSectorResources } from "../../packages/simulation/src/resources/resource-refresh";

describe("resource refresh", () => {
  it("regenerates sector resources up to terrain caps", () => {
    const world_state = createDefaultWorldState("resource_refresh_seed");
    const crater = world_state.registries.sectors.sector_3_0;
    expect(crater).toBeTruthy();
    if (!crater) {
      return;
    }

    crater.resource_stock.flux = 0;
    crater.resource_regen.flux = 2;

    const next = refreshSectorResources(world_state);
    const next_crater = next.registries.sectors["sector_3_0"];

    expect(next_crater).toBeDefined();
    expect(next_crater?.resource_stock.flux).toBe(2);
  });
});
