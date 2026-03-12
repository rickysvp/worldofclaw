import { describe, expect, it } from "vitest";
import world_seed from "../../seed/world.seed.json";
import { advanceWorldTick, tick_phase_order } from "../../packages/simulation/src";
import { validateWorldState } from "../../packages/schemas/src";

describe("tick phase order", () => {
  it("uses the fixed phase order", () => {
    expect(tick_phase_order).toEqual([
      "environment",
      "resource_refresh",
      "agent_upkeep",
      "action_resolution",
      "relation",
      "event_emission"
    ]);
  });

  it("records phase execution in order", () => {
    const parsed = validateWorldState(world_seed);
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) {
      return;
    }

    const result = advanceWorldTick(parsed.data, {
      seed: "phase_order_seed"
    });

    expect(result.phase_trace).toEqual(tick_phase_order);
  });
});
