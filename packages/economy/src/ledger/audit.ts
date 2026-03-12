import type { LedgerEntry } from "../../../schemas/src";
import type { EconomyTrade } from "../market.types";
import type { StructuredSettlement } from "../settlement.types";

export type AuditIssue = {
  code: string;
  message: string;
};

export type AuditResult = {
  ok: boolean;
  issues: AuditIssue[];
};

export const auditSettlementBalances = (settlement: StructuredSettlement): boolean =>
  settlement.postings.reduce((sum, posting) => sum + posting.credits_delta, 0) === 0;

export const auditSettlement = (settlement: StructuredSettlement): AuditResult => {
  const issues: AuditIssue[] = [];
  const total_delta = settlement.postings.reduce((sum, posting) => sum + posting.credits_delta, 0);

  if (total_delta !== 0) {
    issues.push({
      code: "SETTLEMENT_NOT_BALANCED",
      message: `settlement ${settlement.settlement_id} postings sum to ${total_delta}`
    });
  }

  const payer_total = settlement.postings
    .filter((posting) => posting.entity_id === settlement.payer)
    .reduce((sum, posting) => sum + posting.credits_delta, 0);
  if (payer_total >= 0) {
    issues.push({
      code: "PAYER_NOT_DEBITED",
      message: `settlement ${settlement.settlement_id} did not debit payer ${settlement.payer}`
    });
  }

  return {
    ok: issues.length === 0,
    issues
  };
};

export const auditLedgerCreditsNonNegative = (entries: ReadonlyArray<LedgerEntry>): AuditResult => {
  return auditLedgerCreditsNonNegativeWithOpeningBalances(entries, {});
};

export const auditLedgerCreditsNonNegativeWithOpeningBalances = (
  entries: ReadonlyArray<LedgerEntry>,
  opening_balances: Readonly<Record<string, number>>
): AuditResult => {
  const balances: Record<string, number> = { ...opening_balances };
  const issues: AuditIssue[] = [];

  for (const entry of entries) {
    const next_balance = (balances[entry.entity_id] ?? 0) + entry.credits_delta;
    balances[entry.entity_id] = next_balance;
    if (next_balance < 0) {
      issues.push({
        code: "NEGATIVE_LEDGER_BALANCE",
        message: `entity ${entry.entity_id} dropped below zero credits after ledger ${entry.id}`
      });
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
};

export const auditTradeSettlementConsistency = (trade: EconomyTrade, settlement: StructuredSettlement): AuditResult => {
  const issues: AuditIssue[] = [];

  if (trade.payer !== settlement.payer || trade.payee !== settlement.payee) {
    issues.push({
      code: "TRADE_SETTLEMENT_PARTIES_MISMATCH",
      message: `trade ${trade.id} parties do not match settlement ${settlement.settlement_id}`
    });
  }

  if (trade.platform_cut !== settlement.platform_cut || trade.facility_cut !== settlement.facility_cut || trade.net_amount !== settlement.net_amount) {
    issues.push({
      code: "TRADE_SETTLEMENT_AMOUNT_MISMATCH",
      message: `trade ${trade.id} financial fields do not match settlement ${settlement.settlement_id}`
    });
  }

  return {
    ok: issues.length === 0,
    issues
  };
};
