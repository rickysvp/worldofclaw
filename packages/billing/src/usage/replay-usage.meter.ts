import type { UsageMeterRecord, UsageSnapshot } from "../usage-meter.types";

export const meterReplayUsage = (snapshot: UsageSnapshot, tick: number): UsageMeterRecord => ({
  meter_id: `meter_replay_usage_${snapshot.account_id}_${tick}`,
  account_id: snapshot.account_id,
  meter_name: "replay_usage",
  quantity: snapshot.replay_requests,
  unit: "count",
  tick,
  correlation_id: `usage:${snapshot.account_id}:${tick}:replay`
});
