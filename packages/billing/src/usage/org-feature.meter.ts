import type { UsageMeterRecord, UsageSnapshot } from "../usage-meter.types";

export const meterOrgFeatureUsage = (snapshot: UsageSnapshot, tick: number): UsageMeterRecord => ({
  meter_id: `meter_org_feature_${snapshot.account_id}_${tick}`,
  account_id: snapshot.account_id,
  meter_name: "org_feature_usage",
  quantity: snapshot.organization_feature_count + snapshot.facility_license_count,
  unit: "count",
  tick,
  correlation_id: `usage:${snapshot.account_id}:${tick}:org_feature`
});
