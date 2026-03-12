export const billing_plan_ids = ["free", "pro", "org"] as const;
export const invoice_statuses = ["draft", "issued", "paid", "void", "credited"] as const;
export const subscription_statuses = ["trialing", "active", "past_due", "suspended", "cancelled"] as const;
export const usage_meter_names = [
  "active_agents",
  "log_retention_days",
  "replay_usage",
  "api_usage",
  "org_feature_usage",
  "facility_license_usage"
] as const;
export const billing_currency = "credits" as const;
export const billing_cycle_days = 30 as const;
export const default_credit_note_reason = "DISPUTE_RESOLUTION" as const;
