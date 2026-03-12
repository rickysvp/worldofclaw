import { getAccountPlatformScope, getSubscription, upsertSubscription } from "../services/billing-admin.service";
import { authorizePlatformRequest } from "../services/platform-policy.service";
import type { PlatformRequest, PlatformResponse } from "../types";

export const subscriptionsController = (request: PlatformRequest): PlatformResponse<ReturnType<typeof getSubscription>> => {
  const body = (request.body ?? {}) as { account_id?: string; plan_id?: "free" | "pro" | "org"; tick?: number; organization_id?: string | null };
  const account_id = body.account_id ?? request.query?.account_id ?? request.headers?.["x-platform-account"] ?? "unknown_account";
  const permission = body.plan_id ? "subscriptions:write" : "subscriptions:read";
  const scope = getAccountPlatformScope(account_id);
  const auth = authorizePlatformRequest({
    request,
    permission,
    resource: { resource_type: "subscription", resource_id: account_id, owner_account_id: account_id, organization_id: scope.organization_id, plan_id: scope.plan_id }
  });
  if ("status" in auth) return auth;
  const data = body.plan_id ? upsertSubscription({ account_id, plan_id: body.plan_id, tick: body.tick ?? 0, organization_id: body.organization_id ?? null }) : getSubscription(account_id);
  return { status: 200, body: { ok: true, data } };
};
