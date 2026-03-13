import { beforeEach, describe, expect, it } from "vitest";
import { handleInvoicesRoute } from "../../services/platform/src/routes/invoices";
import { handleSubscriptionsRoute } from "../../services/platform/src/routes/subscriptions";
import { reconcileLedger } from "../../packages/audit/src/ledger-reconcile";
import { getWorldState } from "../../services/api/src/services/session.service";
import { resetBillingAdminService } from "../../services/platform/src/services/billing-admin.service";
import { resetMeteringService, recordReplayUsage } from "../../services/platform/src/services/metering.service";

const owner_headers = { "x-platform-role": "owner", "x-platform-subject": "owner_bill", "x-platform-account": "acct_release_bill" };
const finance_headers = { "x-platform-role": "finance_admin", "x-platform-subject": "fin_bill", "x-platform-account": "acct_release_bill" };

describe("billing reconcile readiness", () => {
  beforeEach(() => {
    resetBillingAdminService();
    resetMeteringService();
    handleSubscriptionsRoute({ headers: owner_headers, body: { account_id: "acct_release_bill", plan_id: "pro", tick: 0 } });
    recordReplayUsage("acct_release_bill", 25);
  });

  it("keeps billing settlement and ledger reconcile available", () => {
    const generated = handleInvoicesRoute({ headers: finance_headers, body: { account_id: "acct_release_bill", action: "generate", tick: 30 } });
    expect(generated.status).toBe(200);
    const reconcile = reconcileLedger(getWorldState());
    expect(reconcile.balanced).toBe(true);
  });
});
