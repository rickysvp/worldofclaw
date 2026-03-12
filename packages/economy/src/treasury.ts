import type { LedgerEntry } from "../../schemas/src";
import { platform_treasury_entity_id } from "./constants";

export type TreasurySummary = {
  total_revenue: number;
  entry_count: number;
  by_reason: Record<string, number>;
  by_tick: Record<string, number>;
};

export const summarizeTreasuryFromLedger = (entries: ReadonlyArray<LedgerEntry>): TreasurySummary => {
  const by_reason: Record<string, number> = {};
  const by_tick: Record<string, number> = {};
  let total_revenue = 0;
  let entry_count = 0;

  for (const entry of entries) {
    if (entry.entity_id !== platform_treasury_entity_id || entry.credits_delta <= 0) {
      continue;
    }
    const reason = typeof entry.payload.reason_code === "string" ? entry.payload.reason_code : "unknown";
    const tick_key = String(entry.tick);
    by_reason[reason] = (by_reason[reason] ?? 0) + entry.credits_delta;
    by_tick[tick_key] = (by_tick[tick_key] ?? 0) + entry.credits_delta;
    total_revenue += entry.credits_delta;
    entry_count += 1;
  }

  return {
    total_revenue,
    entry_count,
    by_reason,
    by_tick
  };
};
