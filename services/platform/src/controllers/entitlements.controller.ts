import { getEffectiveEntitlements, getSubscription } from "../services/billing-admin.service";
import { authorizePlatformRequest } from "../services/platform-policy.service";
import type { PlatformRequest, PlatformResponse } from "../types";

export const entitlementsController = (request: PlatformRequest): PlatformResponse<ReturnType<typeof getEffectiveEntitlements>> => {
  const account_id = request.query?.account_id ?? request.headers?.["x-platform-account"] ?? "unknown_account";
  const subscription = getSubscription(account_id);
  const auth = authorizePlatformRequest({
    request,
    permission: "entitlements:read",
    resource: { resource_type: "subscription", resource_id: subscription.subscription_id, owner_account_id: account_id, organization_id: subscription.organization_id, plan_id: subscription.plan_id }
  });
  if ("status" in auth) return auth;
  return { status: 200, body: { ok: true, data: getEffectiveEntitlements(account_id) } };
};
