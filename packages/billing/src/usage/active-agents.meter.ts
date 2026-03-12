import type { UsageMeterRecord, UsageSnapshot } from "../usage-meter.types";

export const meterActiveAgents = (snapshot: UsageSnapshot, tick: number): UsageMeterRecord => ({
  meter_id: `meter_active_agents_${snapshot.account_id}_${tick}`,
  account_id: snapshot.account_id,
  meter_name: "active_agents",
  quantity: snapshot.active_agents,
  unit: "count",
  tick,
  correlation_id: `usage:${snapshot.account_id}:${tick}:active_agents`
});
