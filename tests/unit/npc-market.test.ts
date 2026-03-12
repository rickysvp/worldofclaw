import { describe, expect, it } from "vitest";
import { getNpcMarketEntityId } from "../../packages/economy/src";

describe("npc market", () => {
  it("creates stable npc market entity ids", () => {
    expect(getNpcMarketEntityId("sector_0_0")).toBe("npc_market_sector_0_0");
  });
});
