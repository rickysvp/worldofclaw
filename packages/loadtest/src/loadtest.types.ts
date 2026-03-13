import type { load_scenario_names } from "./constants";

export type LoadScenarioName = (typeof load_scenario_names)[number];

export type LoadScenarioResult = {
  scenario: LoadScenarioName;
  requests: number;
  errors: number;
  p95_ms: number;
  throughput_per_second: number;
  notes: string[];
};

export type LoadReport = {
  scenarios: LoadScenarioResult[];
  passed: boolean;
  failures: string[];
};
