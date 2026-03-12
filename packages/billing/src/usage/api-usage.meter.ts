import type { UsageMeterRecord, UsageSnapshot } from "../usage-meter.types";

export const meterApiUsage = (snapshot: UsageSnapshot, tick: number): UsageMeterRecord => ({
  meter_id: `meter_api_usage_${snapshot.account_id}_${tick}`,
  account_id: snapshot.account_id,
  meter_name: "api_usage",
  quantity: snapshot.heartbeat_requests + snapshot.state_requests + snapshot.jobs_requests + snapshot.action_requests,
  unit: "requests",
  tick,
  correlation_id: `usage:${snapshot.account_id}:${tick}:api`
});
