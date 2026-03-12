import { getPlanEntitlements } from "./entitlements";
import { role_permission_matrix } from "./role-matrix";
import type { PolicyDecision, PlatformPermission } from "./permission.types";
import type { PlanEntitlements, PlatformResource } from "./resource.types";
import type { PlatformActor } from "./role.types";

export type PolicyInput = {
  actor: PlatformActor;
  permission: PlatformPermission;
  resource: PlatformResource;
  entitlement_overrides?: PlanEntitlements | null;
};

const ownsResource = (actor: PlatformActor, resource: PlatformResource): boolean =>
  actor.owner_account_id !== null && resource.owner_account_id !== null && actor.owner_account_id === resource.owner_account_id;

const belongsToOrganization = (actor: PlatformActor, resource: PlatformResource): boolean =>
  actor.organization_id !== null && resource.organization_id !== null && actor.organization_id === resource.organization_id;

export const evaluatePolicy = (input: PolicyInput): PolicyDecision => {
  const matched_roles = input.actor.roles.filter((role) => role_permission_matrix[role].includes(input.permission));

  if (matched_roles.length === 0) {
    return { allowed: false, permission: input.permission, reason_codes: ["ROLE_PERMISSION_MISSING"], matched_roles: [] };
  }

  if (input.actor.roles.includes("super_admin")) {
    return { allowed: true, permission: input.permission, reason_codes: ["SUPER_ADMIN_ALLOWED"], matched_roles };
  }

  const entitlements = input.entitlement_overrides ?? getPlanEntitlements(input.resource.plan_id ?? "free");

  if (input.actor.roles.some((role) => role === "owner" || role === "organization_admin" || role === "agent_manager" || role === "viewer")) {
    if (!ownsResource(input.actor, input.resource) && !belongsToOrganization(input.actor, input.resource) && input.resource.resource_type !== "plan") {
      return { allowed: false, permission: input.permission, reason_codes: ["RESOURCE_SCOPE_MISMATCH"], matched_roles };
    }
  }

  if (input.permission === "enforcement:write" && !input.actor.roles.some((role) => role === "super_admin" || role === "ops_admin")) {
    return { allowed: false, permission: input.permission, reason_codes: ["ENFORCEMENT_WRITE_FORBIDDEN"], matched_roles };
  }

  if (input.permission === "invoices:write" && !input.actor.roles.some((role) => role === "super_admin" || role === "finance_admin" || role === "owner")) {
    return { allowed: false, permission: input.permission, reason_codes: ["INVOICE_WRITE_FORBIDDEN"], matched_roles };
  }

  if (input.permission === "entitlements:read" && input.resource.resource_type === "subscription" && input.resource.plan_id === "free" && entitlements.organization_features && !input.actor.roles.includes("organization_admin")) {
    return { allowed: false, permission: input.permission, reason_codes: ["ORG_FEATURE_ROLE_REQUIRED"], matched_roles };
  }

  return { allowed: true, permission: input.permission, reason_codes: ["POLICY_ALLOWED"], matched_roles };
};
