import { applyEntitlementOverrides, evaluatePolicy, getPlanEntitlements, type EntitlementOverride, type PlatformActor, type PlatformPermission, type PlatformResource } from "../../../../packages/access-control/src/index";
import type { PlatformRequest, PlatformResponse } from "../types";

const parseRoles = (value: string | undefined): PlatformActor["roles"] =>
  value ? value.split(",").map((role) => role.trim()).filter((role): role is PlatformActor["roles"][number] => role.length > 0) : ["viewer"];

export const getPlatformActorFromHeaders = (headers: Record<string, string | undefined> | undefined): PlatformActor => ({
  actor_id: headers?.["x-platform-subject"] ?? "anonymous",
  roles: parseRoles(headers?.["x-platform-role"]),
  owner_account_id: headers?.["x-platform-account"] ?? null,
  organization_id: headers?.["x-platform-org"] ?? null
});

export const authorizePlatformRequest = (input: {
  request: PlatformRequest;
  permission: PlatformPermission;
  resource: PlatformResource;
  overrides?: EntitlementOverride[];
}): { actor: PlatformActor } | PlatformResponse<never> => {
  const actor = getPlatformActorFromHeaders(input.request.headers);
  const base = getPlanEntitlements(input.resource.plan_id ?? "free");
  const effective = input.overrides ? applyEntitlementOverrides(base, input.overrides) : base;
  const decision = evaluatePolicy({ actor, permission: input.permission, resource: input.resource, entitlement_overrides: effective });
  if (!decision.allowed) {
    return {
      status: 403,
      body: {
        ok: false,
        error_code: decision.reason_codes[0] ?? "POLICY_DENIED",
        message: `Permission denied for ${input.permission}.`
      }
    };
  }
  return { actor };
};
