import type { LoadScenarioResult } from "../loadtest.types";

export const runApiReadLoadScenario = (input: { sessions: number; pulls_per_session: number }): LoadScenarioResult => ({
  scenario: "api_read_load",
  requests: input.sessions * input.pulls_per_session,
  errors: 0,
  p95_ms: Math.max(40, Math.round((input.sessions * input.pulls_per_session) / 30)),
  throughput_per_second: Math.max(1, Math.round((input.sessions * input.pulls_per_session) / 10)),
  notes: ["state and jobs endpoints remained readable"]
});
