import type { PlatformPermission } from "./permission.types";
import type { PlatformRole } from "./role.types";

export const role_permission_matrix: Record<PlatformRole, PlatformPermission[]> = {
  super_admin: [
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
  ],
  ops_admin: ["plans:read", "subscriptions:read", "entitlements:read", "usage:read", "enforcement:read", "enforcement:write"],
  finance_admin: ["plans:read", "subscriptions:read", "usage:read", "invoices:read", "invoices:write", "disputes:read", "disputes:write"],
  support_admin: ["plans:read", "subscriptions:read", "entitlements:read", "usage:read", "disputes:read", "enforcement:read"],
  owner: ["plans:read", "subscriptions:read", "subscriptions:write", "entitlements:read", "usage:read", "invoices:read", "disputes:read", "disputes:write", "enforcement:read"],
  organization_admin: ["plans:read", "subscriptions:read", "entitlements:read", "usage:read", "invoices:read", "disputes:read", "enforcement:read"],
  agent_manager: ["plans:read", "entitlements:read", "usage:read"],
  viewer: ["plans:read", "entitlements:read"]
};
