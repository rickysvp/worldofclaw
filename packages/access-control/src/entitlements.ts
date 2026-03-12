import type { PlanEntitlements, PlatformPlanId } from "./resource.types";

const entitlement_map: Record<PlatformPlanId, PlanEntitlements> = {
  free: {
    plan_id: "free",
    active_agent_quota: 1,
    session_quota: 2,
    heartbeat_rate_per_minute: 12,
    state_api_rate_per_minute: 30,
    jobs_api_rate_per_minute: 30,
    action_api_rate_per_minute: 20,
    replay_quota_per_day: 0,
    log_retention_days: 7,
    organization_features: false,
    facility_license_features: false,
    batch_jobs: false
  },
  pro: {
    plan_id: "pro",
    active_agent_quota: 5,
    session_quota: 10,
    heartbeat_rate_per_minute: 60,
    state_api_rate_per_minute: 120,
    jobs_api_rate_per_minute: 120,
    action_api_rate_per_minute: 60,
    replay_quota_per_day: 20,
    log_retention_days: 30,
    organization_features: false,
    facility_license_features: true,
    batch_jobs: true
  },
  org: {
    plan_id: "org",
    active_agent_quota: 25,
    session_quota: 50,
    heartbeat_rate_per_minute: 240,
    state_api_rate_per_minute: 500,
    jobs_api_rate_per_minute: 500,
    action_api_rate_per_minute: 240,
    replay_quota_per_day: 200,
    log_retention_days: 90,
    organization_features: true,
    facility_license_features: true,
    batch_jobs: true
  }
};

export const getPlanEntitlements = (plan_id: PlatformPlanId): PlanEntitlements => entitlement_map[plan_id];
