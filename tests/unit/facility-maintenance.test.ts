import { describe, expect, it } from "vitest";
import { applyFacilityMaintenance } from "../../packages/rules/src";

const generator = {
  id: "facility_gen_maint",
  version: 1,
  created_at_tick: 0,
  updated_at_tick: 0,
  owner_user_id: null,
  owner_agent_id: null,
  operator_agent_id: null,
  sector_id: "sector_0_0",
  facility_type: "generator" as const,
  status: "online" as const,
  access_policy: "public" as const,
  public_use: true,
  level: 1,
  durability: 10,
  durability_max: 10,
  disabled_at_tick: null,
  claimed_at_tick: null,
  power_buffer: 0,
  power_capacity: 10,
  storage_capacity: 10,
  inventory: { power: 0, scrap: 1, composite: 0, circuit: 0, flux: 0, xenite: 0, compute_core: 0, credits: 0 },
  linked_sector_ids: []
};

describe("facility maintenance", () => {
  it("consumes scrap every 12 ticks", () => {
    const result = applyFacilityMaintenance(generator, 12);
    expect(result.maintenance_due).toBe(true);
    expect(result.consumed_scrap).toBe(1);
    expect(result.facility.inventory.scrap).toBe(0);
  });
});
