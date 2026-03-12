import { billing_cycle_days, billing_currency } from "../constants";
import type { BillingInvoice, InvoiceLineItem } from "../invoice.types";
import type { SubscriptionRecord } from "../subscription.types";
import type { UsageMeterRecord, UsageSnapshot } from "../usage-meter.types";
import { getPlatformPlan } from "../pricing/platform-fees";
import { getFacilityLicenseFee } from "../pricing/license-fees";

const makeLine = (input: Omit<InvoiceLineItem, "amount">): InvoiceLineItem => ({ ...input, amount: input.quantity * input.unit_price });

export const buildBillingInvoice = (input: {
  invoice_id: string;
  subscription: SubscriptionRecord;
  usage_snapshot: UsageSnapshot;
  usage_meters: UsageMeterRecord[];
  issued_at_tick: number;
}): BillingInvoice => {
  const plan = getPlatformPlan(input.subscription.plan_id);
  const line_items: InvoiceLineItem[] = [
    makeLine({
      line_id: `${input.invoice_id}_plan`,
      meter_ids: [],
      description: `${plan.display_name} platform plan`,
      quantity: 1,
      unit_price: plan.monthly_price_credits,
      reason_code: "PLAN_BASE_FEE"
    })
  ];

  const replay_overage = Math.max(0, input.usage_snapshot.replay_requests - plan.included_replay_usage);
  if (replay_overage > 0) {
    line_items.push(makeLine({
      line_id: `${input.invoice_id}_replay`,
      meter_ids: input.usage_meters.filter((meter) => meter.meter_name === "replay_usage").map((meter) => meter.meter_id),
      description: "Replay overage",
      quantity: replay_overage,
      unit_price: 5,
      reason_code: "REPLAY_OVERAGE"
    }));
  }

  const api_requests = input.usage_snapshot.heartbeat_requests + input.usage_snapshot.state_requests + input.usage_snapshot.jobs_requests + input.usage_snapshot.action_requests;
  const api_overage = Math.max(0, api_requests - plan.included_api_requests);
  if (api_overage > 0) {
    line_items.push(makeLine({
      line_id: `${input.invoice_id}_api`,
      meter_ids: input.usage_meters.filter((meter) => meter.meter_name === "api_usage").map((meter) => meter.meter_id),
      description: "API overage",
      quantity: api_overage,
      unit_price: 1,
      reason_code: "API_OVERAGE"
    }));
  }

  const extra_log_retention = Math.max(0, input.usage_snapshot.log_retention_days - plan.entitlements.log_retention_days);
  if (extra_log_retention > 0) {
    line_items.push(makeLine({
      line_id: `${input.invoice_id}_retention`,
      meter_ids: input.usage_meters.filter((meter) => meter.meter_name === "log_retention_days").map((meter) => meter.meter_id),
      description: "Log retention extension",
      quantity: extra_log_retention,
      unit_price: 3,
      reason_code: "LOG_RETENTION_OVERAGE"
    }));
  }

  const facility_license_fee = getFacilityLicenseFee(input.usage_snapshot.facility_license_count, plan.included_facility_licenses);
  if (facility_license_fee > 0) {
    line_items.push(makeLine({
      line_id: `${input.invoice_id}_license`,
      meter_ids: input.usage_meters.filter((meter) => meter.meter_name === "org_feature_usage").map((meter) => meter.meter_id),
      description: "Facility license overage",
      quantity: 1,
      unit_price: facility_license_fee,
      reason_code: "FACILITY_LICENSE_OVERAGE"
    }));
  }

  const subtotal = line_items.reduce((sum, line) => sum + line.amount, 0);
  return {
    invoice_id: input.invoice_id,
    account_id: input.subscription.account_id,
    plan_id: input.subscription.plan_id,
    currency: billing_currency,
    status: "issued",
    issued_at_tick: input.issued_at_tick,
    due_at_tick: input.issued_at_tick + billing_cycle_days,
    line_items,
    subtotal,
    total: subtotal,
    settlement_id: null
  };
};
