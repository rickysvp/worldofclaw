import { beforeEach, describe, expect, it } from "vitest";
import { handleDisputesRoute } from "../../services/platform/src/routes/disputes";
import { handleInvoicesRoute } from "../../services/platform/src/routes/invoices";
import { handleSubscriptionsRoute } from "../../services/platform/src/routes/subscriptions";
import { resetBillingAdminService } from "../../services/platform/src/services/billing-admin.service";
import { resetEnforcementService } from "../../services/platform/src/services/enforcement.service";
import { resetMeteringService, recordReplayUsage } from "../../services/platform/src/services/metering.service";

const owner_headers = { "x-platform-role": "owner", "x-platform-subject": "owner_1", "x-platform-account": "acct_dispute" };
const finance_headers = { "x-platform-role": "finance_admin", "x-platform-subject": "fin_1", "x-platform-account": "acct_dispute" };

describe("dispute credit note flow", () => {
  beforeEach(() => {
    resetBillingAdminService();
    resetMeteringService();
    resetEnforcementService();
    handleSubscriptionsRoute({ headers: owner_headers, body: { account_id: "acct_dispute", plan_id: "pro", tick: 0 } });
    recordReplayUsage("acct_dispute", 25);
  });

  it("creates a dispute and resolves it with a credit note", () => {
    const generated = handleInvoicesRoute({ headers: finance_headers, body: { account_id: "acct_dispute", action: "generate", tick: 30 } });
    if (!generated.body.ok || !generated.body.data || !("invoice" in generated.body.data) || !generated.body.data.invoice) throw new Error("missing invoice");
    const invoice = generated.body.data.invoice;

    const dispute = handleDisputesRoute({ headers: owner_headers, body: { account_id: "acct_dispute", action: "create", invoice_id: invoice.invoice_id, requested_amount: 10, reason_code: "REPLAY_OVERCHARGE" } });
    expect(dispute.status).toBe(200);
    if (!dispute.body.ok || !dispute.body.data || !("dispute_id" in dispute.body.data)) throw new Error("missing dispute");

    const resolved = handleDisputesRoute({ headers: finance_headers, body: { account_id: "acct_dispute", action: "resolve", dispute_id: dispute.body.data.dispute_id, approved: true, approved_amount: 10, tick: 31 } });
    expect(resolved.status).toBe(200);
    if (!resolved.body.ok || !resolved.body.data || !("credit_note" in resolved.body.data)) throw new Error("missing resolution");
    expect(resolved.body.data.credit_note?.amount).toBe(10);

    const resolved_again = handleDisputesRoute({ headers: finance_headers, body: { account_id: "acct_dispute", action: "resolve", dispute_id: dispute.body.data.dispute_id, approved: true, approved_amount: 999, tick: 32 } });
    expect(resolved_again.status).toBe(200);
    if (!resolved_again.body.ok || !resolved_again.body.data || !("credit_note" in resolved_again.body.data)) throw new Error("missing repeated resolution");
    expect(resolved_again.body.data.credit_note?.amount).toBe(10);
  });

  it("rejects org scope spoofing for unrelated accounts", () => {
    handleSubscriptionsRoute({ headers: { ...owner_headers, "x-platform-account": "acct_org_admin", "x-platform-org": "org_safe" }, body: { account_id: "acct_org_admin", plan_id: "org", organization_id: "org_safe", tick: 0 } });
    const response = handleDisputesRoute({
      headers: { "x-platform-role": "organization_admin", "x-platform-subject": "org_admin_1", "x-platform-account": "acct_org_admin", "x-platform-org": "org_safe" },
      query: { account_id: "acct_dispute" }
    });
    expect(response.status).toBe(403);
  });
});
