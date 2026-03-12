import type { RegionalPriceInput } from "../price.types";

const toPercent = (value: number): number => Math.round(value * 100);

export const getRegionalPriceModifierPct = (input: RegionalPriceInput): number => {
  const { terrain_type, resource_type, service_kind } = input;

  if (service_kind === "relay") {
    return terrain_type === "relay_highland" ? 125 : 100;
  }

  if (!resource_type) {
    return 100;
  }

  if (terrain_type === "safe_zone") {
    if (resource_type === "scrap" || resource_type === "composite") {
      return 110;
    }
    return 120;
  }

  if (terrain_type === "ruins") {
    if (resource_type === "scrap" || resource_type === "composite") {
      return 90;
    }
  }

  if (terrain_type === "meteor_crater") {
    if (resource_type === "flux" || resource_type === "xenite") {
      return 85;
    }
  }

  if (terrain_type === "industrial_remnant") {
    if (resource_type === "circuit" || resource_type === "compute_core") {
      return 90;
    }
  }

  if (terrain_type === "relay_highland") {
    if (resource_type === "circuit") {
      return 110;
    }
  }

  return 100;
};

export const applyRegionalPrice = (base_price: number, input: RegionalPriceInput): number =>
  Math.max(1, Math.floor((base_price * getRegionalPriceModifierPct(input)) / 100));

export const describeRegionalPriceModifier = (input: RegionalPriceInput): string => `${toPercent(getRegionalPriceModifierPct(input) / 100)}pct`;
