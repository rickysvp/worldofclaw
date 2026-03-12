import { generateInvoiceForAccount, getAccountPlatformScope, listCreditNotes, listInvoices, listSettlements, settleInvoiceForAccount } from "../services/billing-admin.service";
import { authorizePlatformRequest } from "../services/platform-policy.service";
import type { PlatformRequest, PlatformResponse } from "../types";

export const invoicesController = (request: PlatformRequest): PlatformResponse<ReturnType<typeof listInvoices> | { invoice?: ReturnType<typeof generateInvoiceForAccount>; settlement?: ReturnType<typeof settleInvoiceForAccount>; credit_notes?: ReturnType<typeof listCreditNotes>; settlements?: ReturnType<typeof listSettlements> }> => {
  const body = (request.body ?? {}) as { account_id?: string; action?: "generate" | "settle"; invoice_id?: string; tick?: number };
  const account_id = body.account_id ?? request.query?.account_id ?? request.headers?.["x-platform-account"] ?? "unknown_account";
  const permission = body.action ? "invoices:write" : "invoices:read";
  const scope = getAccountPlatformScope(account_id);
  const auth = authorizePlatformRequest({
    request,
    permission,
    resource: { resource_type: "invoice", resource_id: account_id, owner_account_id: account_id, organization_id: scope.organization_id, plan_id: scope.plan_id }
  });
  if ("status" in auth) return auth;
  if (body.action === "generate") {
    return { status: 200, body: { ok: true, data: { invoice: generateInvoiceForAccount({ account_id, tick: body.tick ?? 0 }), credit_notes: listCreditNotes(account_id), settlements: listSettlements(account_id) } } };
  }
  if (body.action === "settle") {
    return { status: 200, body: { ok: true, data: { settlement: settleInvoiceForAccount({ account_id, invoice_id: body.invoice_id ?? "" }), credit_notes: listCreditNotes(account_id), settlements: listSettlements(account_id) } } };
  }
  return { status: 200, body: { ok: true, data: listInvoices(account_id) } };
};
