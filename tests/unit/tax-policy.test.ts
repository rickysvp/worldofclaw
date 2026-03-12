import { describe, expect, it } from "vitest";
import { getTaxBps } from "../../packages/economy/src";

describe("tax policy", () => {
  it("defaults to zero tax", () => {
    expect(getTaxBps({ reason_code: "npc_trade" })).toBe(0);
  });

  it("returns explicit sector tax when provided", () => {
    expect(getTaxBps({ reason_code: "player_trade", sector_tax_bps: 250 })).toBe(250);
  });
});
