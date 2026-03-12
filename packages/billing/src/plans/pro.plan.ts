import { getPlanEntitlements } from "../../../access-control/src/index";
import type { BillingPlan } from "../plan.types";

export const pro_plan: BillingPlan = {
  plan_id: "pro",
  display_name: "Pro",
  monthly_price_credits: 2900,
  entitlements: getPlanEntitlements("pro"),
  included_replay_usage: 20,
  included_api_requests: 10000,
  included_facility_licenses: 3
};
