import type { Facility, MarketQuote, Sector } from "../../../schemas/src";
import {
  applyDynamicPrice,
  applyRegionalPrice,
  applyRiskPrice,
  getBaseMidPrice,
  type EconomicResource
} from "../../../economy/src";

export const getBaseMarketPrice = (resource_type: MarketQuote["resource_type"]): number => getBaseMidPrice(resource_type);

export const getSectorSupplySignal = (sector: Sector, resource_type: MarketQuote["resource_type"]): number =>
  Math.max(1, sector.resource_stock[resource_type] + sector.resource_regen[resource_type]);

export const getSectorDemandSignal = (sector: Sector, resource_type: EconomicResource, facilities: Facility[]): number => {
  let demand = Math.max(1, 12 - sector.resource_stock[resource_type] + Math.floor(sector.danger_level / 10));

  for (const facility of facilities) {
    if (facility.status !== "online") {
      continue;
    }
    if (facility.facility_type === "storage") {
      demand = Math.max(1, demand - 1);
    }
    if (facility.facility_type === "relay" && resource_type === "circuit") {
      demand += 2;
    }
    if (facility.facility_type === "refinery" && (resource_type === "xenite" || resource_type === "compute_core")) {
      demand += 2;
    }
    if (facility.facility_type === "workshop" && (resource_type === "composite" || resource_type === "circuit")) {
      demand += 1;
    }
  }

  return demand;
};

export const getTargetMidPrice = (sector: Sector, facilities: Facility[], quote: MarketQuote): number => {
  const base_price = getBaseMarketPrice(quote.resource_type);
  const regional_price = applyRegionalPrice(base_price, {
    terrain_type: sector.terrain_type,
    resource_type: quote.resource_type
  });
  const risk_price = applyRiskPrice(regional_price, {
    danger_level: sector.danger_level,
    route_level: sector.route_level,
    signal_modifier: sector.signal_modifier
  });

  return applyDynamicPrice({
    previous_mid_price: quote.last_price,
    base_mid_price: risk_price,
    supply_signal: getSectorSupplySignal(sector, quote.resource_type),
    demand_signal: getSectorDemandSignal(sector, quote.resource_type, facilities)
  });
};

export const getTargetDepth = (sector: Sector, facilities: Facility[], quote: MarketQuote): { bid_depth: number; ask_depth: number } => {
  let bid_depth = Math.max(1, 2 + Math.floor(getSectorSupplySignal(sector, quote.resource_type) / 2));
  let ask_depth = Math.max(1, 2 + Math.floor(getSectorSupplySignal(sector, quote.resource_type) / 2));

  for (const facility of facilities) {
    if (facility.status !== "online") {
      continue;
    }
    if (facility.facility_type === "storage") {
      bid_depth += 1;
      ask_depth += 2;
    }
    if (facility.facility_type === "relay") {
      bid_depth += 1;
    }
  }

  return { bid_depth, ask_depth };
};
