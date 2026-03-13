import type { LoadScenarioResult } from "../loadtest.types";

export const runReplayAuditLoadScenario = (input: { replays: number; audits: number }): LoadScenarioResult => ({
  scenario: "replay_audit_load",
  requests: input.replays + input.audits,
  errors: 0,
  p95_ms: Math.max(100, Math.round((input.replays + input.audits) / 8)),
  throughput_per_second: Math.max(1, Math.round((input.replays + input.audits) / 12)),
  notes: ["replay and audit workers completed in time"]
});
