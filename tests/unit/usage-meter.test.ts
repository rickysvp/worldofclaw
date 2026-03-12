import { describe, expect, it } from "vitest";
import { meterActiveAgents, meterApiUsage, meterLogRetention, meterOrgFeatureUsage, meterReplayUsage, type UsageSnapshot } from "../../packages/billing/src";

const snapshot: UsageSnapshot = {
  account_id: "acct_1",
  active_agents: 2,
  sessions: 3,
  heartbeat_requests: 4,
  state_requests: 5,
  jobs_requests: 6,
  action_requests: 7,
  replay_requests: 8,
  log_retention_days: 9,
  organization_feature_count: 1,
  facility_license_count: 2
};

describe("usage meters", () => {
  it("emits active agent meter", () => {
    expect(meterActiveAgents(snapshot, 10).quantity).toBe(2);
  });

  it("emits api usage meter", () => {
    expect(meterApiUsage(snapshot, 10).quantity).toBe(22);
  });

  it("emits retention and org feature meters", () => {
    expect(meterLogRetention(snapshot, 10).quantity).toBe(9);
    expect(meterReplayUsage(snapshot, 10).quantity).toBe(8);
    expect(meterOrgFeatureUsage(snapshot, 10).quantity).toBe(3);
  });
});
