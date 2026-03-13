import type { LoadReport, LoadScenarioResult } from "../loadtest.types";
import { evaluateLoadThreshold } from "./thresholds";

export const buildLoadReport = (scenarios: LoadScenarioResult[]): LoadReport => {
  const failures = scenarios.flatMap((scenario) => {
    const result = evaluateLoadThreshold(scenario);
    return result.failure ? [result.failure] : [];
  });
  return {
    scenarios,
    passed: failures.length === 0,
    failures
  };
};
