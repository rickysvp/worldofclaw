import { getAccountPlatformScope } from "../services/billing-admin.service";
import { evaluateAccountEnforcement, listEnforcementRecords } from "../services/enforcement.service";
import { authorizePlatformRequest } from "../services/platform-policy.service";
import type { PlatformRequest, PlatformResponse } from "../types";

export const enforcementController = (request: PlatformRequest): PlatformResponse<ReturnType<typeof listEnforcementRecords> | ReturnType<typeof evaluateAccountEnforcement>> => {
  const body = (request.body ?? {}) as { account_id?: string; action?: "evaluate"; tick?: number };
  const account_id = body.account_id ?? request.query?.account_id ?? request.headers?.["x-platform-account"] ?? "unknown_account";
  const permission = body.action ? "enforcement:write" : "enforcement:read";
  const scope = getAccountPlatformScope(account_id);
  const auth = authorizePlatformRequest({
    request,
    permission,
    resource: { resource_type: "enforcement", resource_id: account_id, owner_account_id: account_id, organization_id: scope.organization_id, plan_id: scope.plan_id }
  });
  if ("status" in auth) return auth;
  if (body.action === "evaluate") {
    return { status: 200, body: { ok: true, data: evaluateAccountEnforcement({ account_id, tick: body.tick ?? 0 }) } };
  }
  return { status: 200, body: { ok: true, data: listEnforcementRecords(account_id) } };
};
