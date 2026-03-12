import { summarizeTreasuryFromLedger } from "../../economy/src/treasury";
import { auditLedgerCreditsNonNegativeWithOpeningBalances } from "../../economy/src/ledger/audit";
import type { WorldState } from "../../schemas/src";
import type { LedgerReconcileResult } from "./audit.types";

export const reconcileLedger = (world_state: WorldState): LedgerReconcileResult => {
  const treasury = summarizeTreasuryFromLedger(world_state.ledgers.entries);
  const audit = auditLedgerCreditsNonNegativeWithOpeningBalances(
    world_state.ledgers.entries,
    world_state.ledgers.credits_balances_by_entity
  );

  return {
    balanced: audit.ok,
    treasury_total: treasury.total_revenue,
    issues: audit.issues.map((issue) => issue.message)
  };
};
