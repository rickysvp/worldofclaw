import { describe, expect, it } from "vitest";
import { getPlayerMarketEntityId } from "../../packages/economy/src";

describe("player market", () => {
  it("creates stable player market ids", () => {
    expect(getPlayerMarketEntityId("facility_1")).toBe("player_market_facility_1");
  });
});
