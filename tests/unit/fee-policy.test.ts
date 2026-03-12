import { describe, expect, it } from "vitest";
import { getFeePolicy } from "../../packages/economy/src";

describe("fee policy", () => {
  it("uses 3 percent platform fee for player trades", () => {
    expect(getFeePolicy({ reason_code: "player_trade", has_player_owner: false }).platform_fee_bps).toBe(300);
  });

  it("uses 20/80 split for player-owned services", () => {
    expect(getFeePolicy({ reason_code: "charge_service", has_player_owner: true })).toEqual({ platform_fee_bps: 2000, facility_fee_bps: 8000 });
  });
});
