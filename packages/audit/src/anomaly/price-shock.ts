import type { MarketQuote } from "../../../schemas/src";
import type { AuditAlert } from "../audit.types";
import { price_shock_threshold_bps } from "../constants";

export const detectPriceShockAlerts = (quotes: ReadonlyArray<MarketQuote>, tick: number): AuditAlert[] => {
  const alerts: AuditAlert[] = [];
  for (const quote of quotes) {
    if (quote.last_price === 0) {
      continue;
    }
    const mid = Math.floor((quote.bid_price + quote.ask_price) / 2);
    const delta_bps = Math.floor((Math.abs(mid - quote.last_price) * 10_000) / Math.max(1, quote.last_price));
    if (delta_bps > price_shock_threshold_bps) {
      alerts.push({
        alert_id: `alert_price_${quote.id}`,
        code: "PRICE_SHOCK",
        severity: "warn",
        tick,
        message: `quote ${quote.id} moved ${delta_bps}bps from last price`,
        entity_refs: { sector_ids: [quote.sector_id] },
        correlation_id: quote.id
      });
    }
  }
  return alerts;
};
