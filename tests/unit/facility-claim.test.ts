import { describe, expect, it } from "vitest";
import { canClaimFacility, claimFacilityOwnership } from "../../packages/rules/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

describe("facility claim rules", () => {
  it("transfers facility ownership on successful claim", () => {
    const world = createDefaultWorldState("facility_claim_seed");
    world.registries.facilities["facility_claim_target"] = {
      id: "facility_claim_target",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      owner_agent_id: null,
      operator_agent_id: null,
      sector_id: "sector_0_0",
      facility_type: "workshop",
      status: "online",
      access_policy: "restricted",
      public_use: false,
      level: 1,
      durability: 10,
      durability_max: 10,
      disabled_at_tick: null,
      claimed_at_tick: null,
      power_buffer: 0,
      power_capacity: 10,
      storage_capacity: 10,
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
      linked_sector_ids: []
    };

    const facility = world.registries.facilities["facility_claim_target"];
    expect(canClaimFacility(facility, "user_claimant")).toBe(true);
    const claimed = claimFacilityOwnership(facility, "user_claimant", "agent_claimant", 5);
    expect(claimed.owner_user_id).toBe("user_claimant");
    expect(claimed.owner_agent_id).toBe("agent_claimant");
    expect(claimed.claimed_at_tick).toBe(5);
  });
});
