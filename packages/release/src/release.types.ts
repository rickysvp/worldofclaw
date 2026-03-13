import type { release_check_statuses, release_gate_statuses, required_release_chains, staging_environment_names } from "./constants";

export type ReleaseCheckStatus = (typeof release_check_statuses)[number];
export type ReleaseGateStatus = (typeof release_gate_statuses)[number];
export type ReleaseChain = (typeof required_release_chains)[number];
export type ReleaseEnvironment = (typeof staging_environment_names)[number];

export type ReleaseChecklistItem = {
  check_id: string;
  chain: ReleaseChain;
  status: ReleaseCheckStatus;
  message: string;
};

export type ReleaseChecklist = {
  environment: ReleaseEnvironment;
  items: ReleaseChecklistItem[];
};

export type ReleaseDecision = {
  status: ReleaseGateStatus;
  failed_checks: string[];
  warnings: string[];
};

export type EnvironmentReadiness = {
  environment: ReleaseEnvironment;
  ready: boolean;
  missing_keys: string[];
};

export type VersionManifest = {
  version: string;
  modules: string[];
  generated_at: string;
};

export type DependencyMatrix = {
  module: string;
  depends_on: string[];
}[];
