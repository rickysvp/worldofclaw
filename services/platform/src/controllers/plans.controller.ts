import { listBillingPlans } from "../services/billing-admin.service";
import { authorizePlatformRequest } from "../services/platform-policy.service";
import type { PlatformRequest, PlatformResponse } from "../types";

export const plansController = (request: PlatformRequest): PlatformResponse<ReturnType<typeof listBillingPlans>> => {
  const auth = authorizePlatformRequest({
    request,
    permission: "plans:read",
    resource: { resource_type: "plan", resource_id: "plans", owner_account_id: null, organization_id: null, plan_id: "free" }
  });
  if ("status" in auth) return auth;
  return { status: 200, body: { ok: true, data: listBillingPlans() } };
};
