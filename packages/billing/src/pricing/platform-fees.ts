import { free_plan } from "../plans/free.plan";
import { org_plan } from "../plans/org.plan";
import { pro_plan } from "../plans/pro.plan";
import type { BillingPlan, BillingPlanId } from "../plan.types";

const plans: Record<BillingPlanId, BillingPlan> = {
  free: free_plan,
  pro: pro_plan,
  org: org_plan
};

export const getPlatformPlan = (plan_id: BillingPlanId): BillingPlan => plans[plan_id];
export const getPlatformFee = (plan_id: BillingPlanId): number => plans[plan_id].monthly_price_credits;
