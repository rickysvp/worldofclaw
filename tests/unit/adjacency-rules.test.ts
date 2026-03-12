import { describe, expect, it } from "vitest";
import { buildOrthogonalAdjacencyIndex } from "../../packages/rules/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

describe("adjacency rules", () => {
  it("builds four-way adjacency without crossing map bounds", () => {
    const world = createDefaultWorldState("adjacency_seed");
    const index = buildOrthogonalAdjacencyIndex(world.registries.sectors, 5, 5);

    expect(index["sector_0_0"]).toEqual(["sector_1_0", "sector_0_1"]);
    expect(index["sector_2_2"]?.length).toBe(4);
  });
});
