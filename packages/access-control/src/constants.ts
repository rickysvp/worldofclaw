export const platform_roles = [
  "super_admin",
  "ops_admin",
  "finance_admin",
  "support_admin",
  "owner",
  "organization_admin",
  "agent_manager",
  "viewer"
] as const;

export const platform_permissions = [
  "plans:read",
  "subscriptions:read",
  "subscriptions:write",
  "entitlements:read",
  "usage:read",
  "invoices:read",
  "invoices:write",
  "disputes:read",
  "disputes:write",
  "enforcement:read",
  "enforcement:write"
] as const;

export const platform_resource_types = [
  "platform",
  "plan",
  "subscription",
  "usage",
  "invoice",
  "dispute",
  "enforcement"
] as const;

export const platform_plan_ids = ["free", "pro", "org"] as const;
