import { getPlanEntitlements } from "../../../access-control/src/index";
import type { BillingPlan } from "../plan.types";

export const free_plan: BillingPlan = {
  plan_id: "free",
  display_name: "Free",
  monthly_price_credits: 0,
  entitlements: getPlanEntitlements("free"),
  included_replay_usage: 0,
  included_api_requests: 1000,
  included_facility_licenses: 0
};
