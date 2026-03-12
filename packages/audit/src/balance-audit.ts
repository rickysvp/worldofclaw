import type { WorldState } from "../../schemas/src";
import type { BalanceAuditResult } from "./audit.types";

export const auditBalances = (world_state: WorldState): BalanceAuditResult => {
  const issues: string[] = [];

  for (const agent of Object.values(world_state.registries.agents)) {
    const ledger_balance = world_state.ledgers.credits_balances_by_entity[agent.id];
    if (ledger_balance !== undefined && ledger_balance !== agent.credits) {
      issues.push(`agent ${agent.id} credits mismatch: state=${agent.credits} ledger=${ledger_balance}`);
    }
  }

  for (const facility of Object.values(world_state.registries.facilities)) {
    const ledger_balance = world_state.ledgers.credits_balances_by_entity[facility.id];
    if (ledger_balance !== undefined && ledger_balance !== facility.inventory.credits) {
      issues.push(`facility ${facility.id} credits mismatch: state=${facility.inventory.credits} ledger=${ledger_balance}`);
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
};
