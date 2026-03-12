import { createDispute, getAccountPlatformScope, listDisputes, resolveDisputeForAccount } from "../services/billing-admin.service";
import { noteDisputeForEnforcement, releaseDisputeForEnforcement } from "../services/enforcement.service";
import { authorizePlatformRequest } from "../services/platform-policy.service";
import type { PlatformRequest, PlatformResponse } from "../types";

export const disputesController = (request: PlatformRequest): PlatformResponse<ReturnType<typeof listDisputes> | ReturnType<typeof createDispute> | NonNullable<ReturnType<typeof resolveDisputeForAccount>>> => {
  const body = (request.body ?? {}) as { account_id?: string; action?: "create" | "resolve"; invoice_id?: string; requested_amount?: number; reason_code?: string; dispute_id?: string; approved?: boolean; approved_amount?: number; tick?: number };
  const account_id = body.account_id ?? request.query?.account_id ?? request.headers?.["x-platform-account"] ?? "unknown_account";
  const permission = body.action ? "disputes:write" : "disputes:read";
  const scope = getAccountPlatformScope(account_id);
  const auth = authorizePlatformRequest({
    request,
    permission,
    resource: { resource_type: "dispute", resource_id: account_id, owner_account_id: account_id, organization_id: scope.organization_id, plan_id: scope.plan_id }
  });
  if ("status" in auth) return auth;
  if (body.action === "create") {
    noteDisputeForEnforcement(account_id);
    return { status: 200, body: { ok: true, data: createDispute({ account_id, invoice_id: body.invoice_id ?? "", requested_amount: body.requested_amount ?? 0, reason_code: body.reason_code ?? "DISPUTE_CREATED" }) } };
  }
  if (body.action === "resolve") {
    const resolution = resolveDisputeForAccount({ account_id, dispute_id: body.dispute_id ?? "", approved: body.approved ?? false, approved_amount: body.approved_amount ?? 0, tick: body.tick ?? 0 });
    if (!resolution) {
      return { status: 404, body: { ok: false, error_code: "DISPUTE_NOT_FOUND", message: "Dispute not found." } };
    }
    if (resolution.enforcement_release) {
      releaseDisputeForEnforcement(account_id);
    }
    return { status: 200, body: { ok: true, data: resolution } };
  }
  return { status: 200, body: { ok: true, data: listDisputes(account_id) } };
};
