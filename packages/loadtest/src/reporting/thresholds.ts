import { default_error_threshold, default_latency_threshold_ms } from "../constants";
import type { LoadScenarioResult } from "../loadtest.types";

export const evaluateLoadThreshold = (scenario: LoadScenarioResult): { passed: boolean; failure: string | null } => {
  const error_ratio = scenario.requests === 0 ? 0 : scenario.errors / scenario.requests;
  if (scenario.p95_ms > default_latency_threshold_ms) {
    return { passed: false, failure: `${scenario.scenario}:p95_exceeded` };
  }
  if (error_ratio > default_error_threshold) {
    return { passed: false, failure: `${scenario.scenario}:error_ratio_exceeded` };
  }
  return { passed: true, failure: null };
};
