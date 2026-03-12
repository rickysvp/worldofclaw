import { getAccountPlatformScope, listUsageForAccount } from "../services/billing-admin.service";
import { authorizePlatformRequest } from "../services/platform-policy.service";
import type { PlatformRequest, PlatformResponse } from "../types";

export const usageController = (request: PlatformRequest): PlatformResponse<ReturnType<typeof listUsageForAccount>> => {
  const account_id = request.query?.account_id ?? request.headers?.["x-platform-account"] ?? "unknown_account";
  const scope = getAccountPlatformScope(account_id);
  const auth = authorizePlatformRequest({
    request,
    permission: "usage:read",
    resource: { resource_type: "usage", resource_id: account_id, owner_account_id: account_id, organization_id: scope.organization_id, plan_id: scope.plan_id }
  });
  if ("status" in auth) return auth;
  return { status: 200, body: { ok: true, data: listUsageForAccount(account_id) } };
};
