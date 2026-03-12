import { beforeEach, describe, expect, it } from "vitest";
import { handleInvoicesRoute } from "../../services/platform/src/routes/invoices";
import { handleSubscriptionsRoute } from "../../services/platform/src/routes/subscriptions";
import { resetBillingAdminService } from "../../services/platform/src/services/billing-admin.service";
import { resetMeteringService, recordApiUsage, recordReplayUsage, setFacilityLicenseCount } from "../../services/platform/src/services/metering.service";

const finance_headers = { "x-platform-role": "finance_admin", "x-platform-subject": "fin_1", "x-platform-account": "acct_bill" };

describe("platform billing flow", () => {
  beforeEach(() => {
    resetBillingAdminService();
    resetMeteringService();
    handleSubscriptionsRoute({ headers: { ...finance_headers, "x-platform-role": "owner" }, body: { account_id: "acct_bill", plan_id: "pro", tick: 0 } });
    recordApiUsage({ account_id: "acct_bill", endpoint: "heartbeat", count: 10050 });
    recordReplayUsage("acct_bill", 25);
    setFacilityLicenseCount("acct_bill", 5);
  });

  it("generates and settles an invoice from meters", () => {
    const generated = handleInvoicesRoute({ headers: finance_headers, body: { account_id: "acct_bill", action: "generate", tick: 30 } });
    expect(generated.status).toBe(200);
    if (!generated.body.ok || !generated.body.data || !("invoice" in generated.body.data) || !generated.body.data.invoice) throw new Error("missing invoice");
    expect(generated.body.data.invoice.total).toBeGreaterThan(0);

    const settled = handleInvoicesRoute({ headers: finance_headers, body: { account_id: "acct_bill", action: "settle", invoice_id: generated.body.data.invoice.invoice_id } });
    expect(settled.status).toBe(200);
    if (!settled.body.ok || !settled.body.data || !("settlement" in settled.body.data) || !settled.body.data.settlement) throw new Error("missing settlement");
    expect(settled.body.data.settlement.status).toBe("paid");

    const generated_again = handleInvoicesRoute({ headers: finance_headers, body: { account_id: "acct_bill", action: "generate", tick: 30 } });
    expect(generated_again.status).toBe(200);
    if (!generated_again.body.ok || !generated_again.body.data || !("invoice" in generated_again.body.data) || !generated_again.body.data.invoice) throw new Error("missing invoice on replay");
    expect(generated_again.body.data.invoice.invoice_id).toBe(generated.body.data.invoice.invoice_id);
  });
});
