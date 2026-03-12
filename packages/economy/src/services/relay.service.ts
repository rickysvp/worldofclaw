import { service_base_prices } from "../constants";
import { applyRegionalPrice } from "../pricing/regional-price";
import type { TerrainType } from "../../../schemas/src";

export const getRelayServicePrice = (terrain_type: TerrainType): number =>
  applyRegionalPrice(service_base_prices.relay, { terrain_type, service_kind: "relay" });
