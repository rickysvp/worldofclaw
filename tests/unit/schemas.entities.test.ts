import { describe, expect, it } from "vitest";
import {
  agent_schema,
  contract_schema,
  event_schema,
  facility_schema,
  sector_schema
} from "../../packages/schemas/src";

describe("entity schemas", () => {
  it("applies agent defaults", () => {
    const parsed = agent_schema.parse({
      id: "agent_test_01",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: "user_01",
      external_agent_id: "external_01",
      name: "Test Agent",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 20,
      durability: 8,
      durability_max: 10,
      compute: 5,
      compute_max: 10,
      cargo_used: 1,
      cargo_max: 10,
      credits: 100,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 1,
      access_level: 1,
      inventory: {
        power: 1,
        scrap: 0,
        composite: 0,
        circuit: 0,
        flux: 0,
        xenite: 0,
        compute_core: 0,
        credits: 100
      },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    });

    expect(parsed.status).toBe("idle");
    expect(parsed.inventory.power).toBe(1);
  });

  it("rejects illegal negative numbers", () => {
    expect(() =>
      agent_schema.parse({
        id: "agent_bad_01",
        version: 1,
        created_at_tick: 0,
        updated_at_tick: 0,
        owner_user_id: null,
        external_agent_id: null,
        name: "Broken Agent",
        location: "sector_0_0",
        status: "idle",
        power: -1,
        power_max: 20,
        durability: 8,
        durability_max: 10,
        compute: 5,
        compute_max: 10,
        cargo_used: 1,
        cargo_max: 10,
        credits: 100,
        trust: 0,
        threat: 0,
        bond: 0,
        shelter_level: 1,
        access_level: 1,
        inventory: {
          power: 1,
          scrap: 0,
          composite: 0,
          circuit: 0,
          flux: 0,
          xenite: 0,
          compute_core: 0,
          credits: 100
        },
        skills: [],
        affiliations: [],
        runtime_flags: {}
      })
    ).toThrow();
  });

  it("rejects missing required fields", () => {
    expect(() => sector_schema.parse({})).toThrow();
    expect(() => facility_schema.parse({})).toThrow();
    expect(() => contract_schema.parse({})).toThrow();
    expect(() => event_schema.parse({})).toThrow();
  });
});
