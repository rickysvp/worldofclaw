import { createCreditNote, buildBillingInvoice, settleBillingInvoice, settleCreditNote, free_plan, org_plan, pro_plan, type BillingInvoice, type BillingPlan, type BillingPlanId, type BillingSettlement, type CreditNote, type SubscriptionRecord } from "../../../../packages/billing/src/index";
import { getPlanEntitlements, type PlanEntitlements } from "../../../../packages/access-control/src/index";
import { resolveDispute, type BillingDispute } from "../../../../packages/risk/src/index";
import { buildUsageMeters, collectUsageSnapshot, getUsageMeters } from "./metering.service";

type BillingStore = {
  subscriptions: Map<string, SubscriptionRecord>;
  invoices: Map<string, BillingInvoice[]>;
  settlements: Map<string, BillingSettlement[]>;
  credit_notes: Map<string, CreditNote[]>;
  disputes: Map<string, BillingDispute[]>;
};

const createBillingStore = (): BillingStore => ({
  subscriptions: new Map(),
  invoices: new Map(),
  settlements: new Map(),
  credit_notes: new Map(),
  disputes: new Map()
});

let billing_store = createBillingStore();

const plan_map: Record<BillingPlanId, BillingPlan> = { free: free_plan, pro: pro_plan, org: org_plan };

export const resetBillingAdminService = (): void => {
  billing_store = createBillingStore();
};

export const listBillingPlans = (): BillingPlan[] => Object.values(plan_map);

export const upsertSubscription = (input: { account_id: string; organization_id?: string | null; plan_id: BillingPlanId; tick: number }): SubscriptionRecord => {
  const current = billing_store.subscriptions.get(input.account_id);
  const next: SubscriptionRecord = {
    subscription_id: current?.subscription_id ?? `subscription_${input.account_id}`,
    account_id: input.account_id,
    organization_id: input.organization_id ?? current?.organization_id ?? null,
    plan_id: input.plan_id,
    status: "active",
    started_at_tick: current?.started_at_tick ?? input.tick,
    renewed_at_tick: input.tick,
    next_invoice_tick: input.tick + 30,
    cancelled_at_tick: null
  };
  billing_store.subscriptions.set(input.account_id, next);
  return { ...next };
};

export const getSubscription = (account_id: string): SubscriptionRecord => {
  const existing = billing_store.subscriptions.get(account_id);
  if (existing) {
    return { ...existing };
  }
  return upsertSubscription({ account_id, plan_id: "free", tick: 0 });
};

export const getEffectiveEntitlements = (account_id: string): PlanEntitlements => getPlanEntitlements(getSubscription(account_id).plan_id);

export const getAccountPlatformScope = (account_id: string): { account_id: string; organization_id: string | null; plan_id: BillingPlanId } => {
  const subscription = getSubscription(account_id);
  return {
    account_id,
    organization_id: subscription.organization_id,
    plan_id: subscription.plan_id
  };
};

export const generateInvoiceForAccount = (input: { account_id: string; tick: number }): BillingInvoice => {
  const existing = (billing_store.invoices.get(input.account_id) ?? []).find((candidate) => candidate.issued_at_tick === input.tick);
  if (existing) {
    return structuredClone(existing);
  }

  const subscription = getSubscription(input.account_id);
  const usage_snapshot = collectUsageSnapshot(input.account_id);
  const usage_meters = buildUsageMeters(input.account_id, input.tick);
  const invoice = buildBillingInvoice({
    invoice_id: `invoice_${input.account_id}_${input.tick}`,
    subscription,
    usage_snapshot,
    usage_meters,
    issued_at_tick: input.tick
  });
  billing_store.invoices.set(input.account_id, [...(billing_store.invoices.get(input.account_id) ?? []), invoice]);
  return structuredClone(invoice);
};

export const settleInvoiceForAccount = (input: { account_id: string; invoice_id: string }): BillingSettlement | null => {
  const invoice = (billing_store.invoices.get(input.account_id) ?? []).find((candidate) => candidate.invoice_id === input.invoice_id);
  if (!invoice) {
    return null;
  }
  if (invoice.settlement_id !== null) {
    return structuredClone((billing_store.settlements.get(input.account_id) ?? []).find((candidate) => candidate.settlement_id === invoice.settlement_id) ?? null);
  }
  const settlement = settleBillingInvoice(invoice);
  invoice.status = "paid";
  invoice.settlement_id = settlement.settlement_id;
  billing_store.settlements.set(input.account_id, [...(billing_store.settlements.get(input.account_id) ?? []), settlement]);
  return structuredClone(settlement);
};

export const listInvoices = (account_id: string): BillingInvoice[] => structuredClone(billing_store.invoices.get(account_id) ?? []);
export const listSettlements = (account_id: string): BillingSettlement[] => structuredClone(billing_store.settlements.get(account_id) ?? []);
export const listCreditNotes = (account_id: string): CreditNote[] => structuredClone(billing_store.credit_notes.get(account_id) ?? []);
export const listDisputes = (account_id: string): BillingDispute[] => structuredClone(billing_store.disputes.get(account_id) ?? []);
export const listUsageForAccount = (account_id: string) => ({ snapshot: collectUsageSnapshot(account_id), meters: getUsageMeters(account_id) });

export const createDispute = (input: { account_id: string; invoice_id: string; requested_amount: number; reason_code: string }): BillingDispute => {
  const dispute: BillingDispute = {
    dispute_id: `dispute_${input.account_id}_${input.invoice_id}_${input.requested_amount}`,
    invoice_id: input.invoice_id,
    account_id: input.account_id,
    reason_code: input.reason_code,
    status: "open",
    requested_amount: input.requested_amount
  };
  billing_store.disputes.set(input.account_id, [...(billing_store.disputes.get(input.account_id) ?? []), dispute]);
  return structuredClone(dispute);
};

export const resolveDisputeForAccount = (input: { account_id: string; dispute_id: string; approved: boolean; approved_amount: number; tick: number }) => {
  const disputes = billing_store.disputes.get(input.account_id) ?? [];
  const dispute = disputes.find((candidate) => candidate.dispute_id === input.dispute_id);
  if (!dispute) {
    return null;
  }
  const existing_credit_note = (billing_store.credit_notes.get(input.account_id) ?? []).find((candidate) => candidate.invoice_id === dispute.invoice_id && candidate.credit_note_id === `credit_${input.dispute_id}`);
  if (dispute.status === "resolved" || dispute.status === "rejected") {
    return {
      dispute: structuredClone(dispute),
      credit_note: existing_credit_note ? structuredClone(existing_credit_note) : null,
      enforcement_release: false
    };
  }

  const invoice = (billing_store.invoices.get(input.account_id) ?? []).find((candidate) => candidate.invoice_id === dispute.invoice_id);
  const max_credit_amount = invoice?.total ?? dispute.requested_amount;
  const resolution = resolveDispute({
    dispute,
    approved: input.approved,
    approved_amount: input.approved_amount,
    max_credit_amount,
    issued_at_tick: input.tick,
    createCreditNote: (amount: number) => createCreditNote({
      credit_note_id: `credit_${input.dispute_id}`,
      invoice_id: dispute.invoice_id,
      account_id: dispute.account_id,
      amount,
      issued_at_tick: input.tick
    })
  });

  Object.assign(dispute, resolution.dispute);
  if (resolution.credit_note) {
    billing_store.credit_notes.set(input.account_id, [...(billing_store.credit_notes.get(input.account_id) ?? []), resolution.credit_note]);
    const settlement = settleCreditNote(resolution.credit_note);
    billing_store.settlements.set(input.account_id, [...(billing_store.settlements.get(input.account_id) ?? []), settlement]);
  }
  return {
    dispute: structuredClone(dispute),
    credit_note: resolution.credit_note ? structuredClone(resolution.credit_note) : null,
    enforcement_release: resolution.enforcement_release
  };
};
