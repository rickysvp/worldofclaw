import type { PlanEntitlements } from "../../access-control/src";
import type { billing_plan_ids } from "./constants";

export type BillingPlanId = (typeof billing_plan_ids)[number];

export type BillingPlan = {
  plan_id: BillingPlanId;
  display_name: string;
  monthly_price_credits: number;
  entitlements: PlanEntitlements;
  included_replay_usage: number;
  included_api_requests: number;
  included_facility_licenses: number;
};
