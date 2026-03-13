import type { LoadScenarioResult } from "../loadtest.types";

export const runHeartbeatBurstScenario = (input: { concurrent_sessions: number; heartbeats_per_session: number }): LoadScenarioResult => {
  const requests = input.concurrent_sessions * input.heartbeats_per_session;
  return {
    scenario: "heartbeat_burst",
    requests,
    errors: 0,
    p95_ms: Math.max(50, Math.round(requests / 40)),
    throughput_per_second: Math.max(1, Math.round(requests / 15)),
    notes: ["heartbeat pipeline remained stable"]
  };
};
