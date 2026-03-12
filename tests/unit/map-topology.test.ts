import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { advanceWorldTick } from "../../packages/simulation/src";

describe("map topology", () => {
  it("builds orthogonal sector neighbor indexes for corners and center sectors", () => {
    const world_state = createDefaultWorldState("map_topology_seed");
    const result = advanceWorldTick(world_state, {
      seed: "map_topology_seed"
    });

    expect(result.next_state.indexes.neighbor_sector_ids["sector_0_0"]).toEqual(["sector_1_0", "sector_0_1"]);
    expect(result.next_state.indexes.neighbor_sector_ids["sector_2_2"]).toHaveLength(4);
  });
});
