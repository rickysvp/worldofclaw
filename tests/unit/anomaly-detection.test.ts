import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import {
  detectControlDriftAlerts,
  detectDoubleSettlementAlerts,
  detectNegativeResourceAlerts,
  detectPriceShockAlerts
} from "../../packages/audit/src";

describe("anomaly detection", () => {
  it("detects negative resource alerts", () => {
    const world = createDefaultWorldState("negative_seed");
    const sector = world.registries.sectors.sector_0_0;
    if (!sector) throw new Error("missing sector_0_0");
    sector.resource_stock.scrap = -1;
    expect(detectNegativeResourceAlerts(world)).toHaveLength(1);
  });

  it("detects duplicate settlements", () => {
    const trades = [
      {
        id: "trade_1",
        version: 1,
        created_at_tick: 1,
        updated_at_tick: 1,
        sector_id: "sector_0_0",
        market_kind: "npc",
        order_id: "order_1",
        buyer_agent_id: null,
        seller_agent_id: "agent_1",
        payer: "npc_market_sector_0_0",
        payee: "agent_1",
        resource_type: "scrap",
        quantity: 1,
        unit_price: 5,
        total_price: 5,
        platform_cut: 0,
        facility_cut: 0,
        net_amount: 5,
        reason_code: "trade",
        executed_at_tick: 1
      },
      {
        id: "trade_2",
        version: 1,
        created_at_tick: 1,
        updated_at_tick: 1,
        sector_id: "sector_0_0",
        market_kind: "npc",
        order_id: "order_1",
        buyer_agent_id: null,
        seller_agent_id: "agent_1",
        payer: "npc_market_sector_0_0",
        payee: "agent_1",
        resource_type: "scrap",
        quantity: 1,
        unit_price: 5,
        total_price: 5,
        platform_cut: 0,
        facility_cut: 0,
        net_amount: 5,
        reason_code: "trade",
        executed_at_tick: 1
      }
    ] as const;
    expect(detectDoubleSettlementAlerts(trades, 1)).toHaveLength(1);
  });

  it("detects price shocks and control drift", () => {
    const world = createDefaultWorldState("price_seed");
    const quote = Object.values(world.registries.market_quotes)[0];
    if (!quote) throw new Error("missing quote");
    quote.last_price = 1;
    quote.bid_price = 10;
    quote.ask_price = 12;
    expect(detectPriceShockAlerts([quote], world.meta.current_tick)).toHaveLength(1);
    const sector = world.registries.sectors.sector_0_0;
    if (!sector) throw new Error("missing sector_0_0");
    sector.control_state = "controlled";
    sector.controller_owner_user_id = "user_x";
    expect(detectControlDriftAlerts(world)).toHaveLength(1);
  });
});
