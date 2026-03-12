import type { AuditAlert } from "../audit.types";
import type { MarketTrade } from "../../../schemas/src";

export const detectDoubleSettlementAlerts = (trades: ReadonlyArray<MarketTrade>, tick: number): AuditAlert[] => {
  const seen = new Set<string>();
  const alerts: AuditAlert[] = [];
  for (const trade of trades) {
    const key = `${trade.order_id}:${trade.reason_code}:${trade.executed_at_tick}`;
    if (seen.has(key)) {
      alerts.push({
        alert_id: `alert_double_${trade.id}`,
        code: "DOUBLE_SETTLEMENT",
        severity: "error",
        tick,
        message: `duplicate settlement detected for order ${trade.order_id}`,
        entity_refs: { agent_ids: [trade.buyer_agent_id, trade.seller_agent_id].filter((value): value is string => value !== null) },
        correlation_id: trade.id
      });
    }
    seen.add(key);
  }
  return alerts;
};
