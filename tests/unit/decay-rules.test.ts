import { describe, expect, it } from "vitest";
import { applyAgentPassiveDecay, getLowDurabilityPenalty, getStoppedDurabilityPenalty, shouldBecomeWrecked } from "../../packages/rules/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

describe("decay rules", () => {
  it("applies idle, night, and low-durability decay", () => {
    const agent = createDefaultWorldState("decay_seed").registries.agents["missing"] ?? {
      id: "agent_decay",
      version: 1,
      created_at_tick: 0,
      updated_at_tick: 0,
      owner_user_id: null,
      external_agent_id: null,
      name: "Decay",
      location: "sector_0_0",
      status: "idle",
      power: 10,
      power_max: 10,
      durability: 40,
      durability_max: 100,
      compute: 1,
      compute_max: 1,
      cargo_used: 0,
      cargo_max: 10,
      credits: 0,
      trust: 0,
      threat: 0,
      bond: 0,
      shelter_level: 0,
      access_level: 0,
      inventory: { power: 0, scrap: 0, composite: 0, circuit: 0, flux: 2, xenite: 0, compute_core: 0, credits: 0 },
      skills: [],
      affiliations: [],
      runtime_flags: {}
    };
    const next = applyAgentPassiveDecay(agent, { is_day: false, has_shelter: false, tick_number: 1 });
    expect(getLowDurabilityPenalty(40)).toBe(1);
    expect(next.power).toBe(7);
    expect(next.inventory.flux).toBe(1);
  });

  it("wrecks stopped agents after threshold", () => {
    expect(getStoppedDurabilityPenalty(3)).toBe(10);
    expect(shouldBecomeWrecked(12)).toBe(true);
  });
});
