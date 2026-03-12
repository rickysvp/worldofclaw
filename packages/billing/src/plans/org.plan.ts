import { getPlanEntitlements } from "../../../access-control/src/index";
import type { BillingPlan } from "../plan.types";

export const org_plan: BillingPlan = {
  plan_id: "org",
  display_name: "Org",
  monthly_price_credits: 9900,
  entitlements: getPlanEntitlements("org"),
  included_replay_usage: 200,
  included_api_requests: 100000,
  included_facility_licenses: 20
};
