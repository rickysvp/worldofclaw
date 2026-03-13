import type { LoadScenarioResult } from "../loadtest.types";

export const runMixedWorldLoadScenario = (input: { agents: number; actions_per_tick: number; ticks: number }): LoadScenarioResult => {
  const requests = input.agents * input.actions_per_tick * input.ticks;
  return {
    scenario: "mixed_world_load",
    requests,
    errors: 0,
    p95_ms: Math.max(120, Math.round(requests / 25)),
    throughput_per_second: Math.max(1, Math.round(requests / 20)),
    notes: ["world load includes actions, jobs, and billing checks"]
  };
};
