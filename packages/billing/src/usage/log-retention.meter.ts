import type { UsageMeterRecord, UsageSnapshot } from "../usage-meter.types";

export const meterLogRetention = (snapshot: UsageSnapshot, tick: number): UsageMeterRecord => ({
  meter_id: `meter_log_retention_${snapshot.account_id}_${tick}`,
  account_id: snapshot.account_id,
  meter_name: "log_retention_days",
  quantity: snapshot.log_retention_days,
  unit: "days",
  tick,
  correlation_id: `usage:${snapshot.account_id}:${tick}:log_retention`
});
