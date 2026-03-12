import type { platform_plan_ids, platform_resource_types } from "./constants";

export type PlatformResourceType = (typeof platform_resource_types)[number];
export type PlatformPlanId = (typeof platform_plan_ids)[number];

export type PlanEntitlements = {
  plan_id: PlatformPlanId;
  active_agent_quota: number;
  session_quota: number;
  heartbeat_rate_per_minute: number;
  state_api_rate_per_minute: number;
  jobs_api_rate_per_minute: number;
  action_api_rate_per_minute: number;
  replay_quota_per_day: number;
  log_retention_days: number;
  organization_features: boolean;
  facility_license_features: boolean;
  batch_jobs: boolean;
};

export type PlatformResource = {
  resource_type: PlatformResourceType;
  resource_id: string;
  owner_account_id: string | null;
  organization_id: string | null;
  plan_id?: PlatformPlanId;
};
