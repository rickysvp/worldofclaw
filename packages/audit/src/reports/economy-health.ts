import type { EconomyHealthReport } from "../audit.types";
import type { WorldState } from "../../../schemas/src";
import { reconcileLedger } from "../ledger-reconcile";

export const buildEconomyHealthReport = (world_state: WorldState): EconomyHealthReport => {
  const reconcile = reconcileLedger(world_state);
  return {
    total_credits: Object.values(world_state.ledgers.credits_balances_by_entity).reduce((sum, value) => sum + value, 0),
    treasury_total: reconcile.treasury_total,
    market_trade_count: Object.keys(world_state.registries.market_trades).length,
    issues: reconcile.issues
  };
};
