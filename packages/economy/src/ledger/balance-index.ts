import type { LedgerEntry } from "../../../schemas/src";

export const buildCreditsBalanceIndex = (entries: ReadonlyArray<LedgerEntry>): Record<string, number> => {
  const balances: Record<string, number> = {};
  for (const entry of entries) {
    balances[entry.entity_id] = (balances[entry.entity_id] ?? 0) + entry.credits_delta;
  }
  return balances;
};
