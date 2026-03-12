import { describe, expect, it } from "vitest";
import { buildBillingInvoice, meterApiUsage, meterReplayUsage, pro_plan, type SubscriptionRecord, type UsageSnapshot } from "../../packages/billing/src";

const subscription: SubscriptionRecord = {
  subscription_id: "sub_1",
  account_id: "acct_1",
  organization_id: null,
  plan_id: "pro",
  status: "active",
  started_at_tick: 0,
  renewed_at_tick: 0,
  next_invoice_tick: 30,
  cancelled_at_tick: null
};

const snapshot: UsageSnapshot = {
  account_id: "acct_1",
  active_agents: 1,
  sessions: 2,
  heartbeat_requests: pro_plan.included_api_requests + 1,
  state_requests: 0,
  jobs_requests: 0,
  action_requests: 0,
  replay_requests: pro_plan.included_replay_usage + 2,
  log_retention_days: 30,
  organization_feature_count: 0,
  facility_license_count: 0
};

describe("invoice builder", () => {
  it("builds invoice with plan fee and overages", () => {
    const invoice = buildBillingInvoice({
      invoice_id: "inv_1",
      subscription,
      usage_snapshot: snapshot,
      usage_meters: [meterApiUsage(snapshot, 30), meterReplayUsage(snapshot, 30)],
      issued_at_tick: 30
    });
    expect(invoice.total).toBeGreaterThan(pro_plan.monthly_price_credits);
    expect(invoice.line_items.some((line) => line.reason_code === "REPLAY_OVERAGE")).toBe(true);
  });
});
