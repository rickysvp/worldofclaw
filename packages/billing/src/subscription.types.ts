import type { BillingPlanId } from "./plan.types";
import type { subscription_statuses } from "./constants";

export type SubscriptionStatus = (typeof subscription_statuses)[number];

export type SubscriptionRecord = {
  subscription_id: string;
  account_id: string;
  organization_id: string | null;
  plan_id: BillingPlanId;
  status: SubscriptionStatus;
  started_at_tick: number;
  renewed_at_tick: number;
  next_invoice_tick: number;
  cancelled_at_tick: number | null;
};
