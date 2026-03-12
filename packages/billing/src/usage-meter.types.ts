import type { usage_meter_names } from "./constants";

export type UsageMeterName = (typeof usage_meter_names)[number];

export type UsageMeterRecord = {
  meter_id: string;
  account_id: string;
  meter_name: UsageMeterName;
  quantity: number;
  unit: "count" | "days" | "requests";
  tick: number;
  correlation_id: string;
};

export type UsageSnapshot = {
  account_id: string;
  active_agents: number;
  sessions: number;
  heartbeat_requests: number;
  state_requests: number;
  jobs_requests: number;
  action_requests: number;
  replay_requests: number;
  log_retention_days: number;
  organization_feature_count: number;
  facility_license_count: number;
};
