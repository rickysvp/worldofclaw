import type { LedgerEntry, MarketTrade } from "../../schemas/src";
import type { WorldLogEntry } from "./log.types";

export const createEconomyLog = (world_id: string, trade: MarketTrade, ledger_entries: ReadonlyArray<LedgerEntry>): WorldLogEntry => ({
  log_id: `log_economy_${trade.id}`,
  world_id,
  tick: trade.executed_at_tick,
  timestamp: new Date(trade.executed_at_tick * 600_000).toISOString(),
  log_type: "economy_log",
  entity_refs: {
    agent_ids: [trade.buyer_agent_id, trade.seller_agent_id].filter((value): value is string => value !== null),
    sector_ids: [trade.sector_id],
    ledger_entry_ids: ledger_entries.map((entry) => entry.id)
  },
  severity: "info",
  payload: {
    market_kind: trade.market_kind,
    resource_type: trade.resource_type,
    quantity: trade.quantity,
    unit_price: trade.unit_price,
    total_price: trade.total_price,
    platform_cut: trade.platform_cut,
    facility_cut: trade.facility_cut,
    net_amount: trade.net_amount,
    reason_code: trade.reason_code
  },
  correlation_id: trade.id
});
