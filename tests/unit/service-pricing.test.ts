import { describe, expect, it } from "vitest";
import { getRefineryServicePrice, getRelayServicePrice, getStorageServicePrice } from "../../packages/economy/src";

describe("service pricing", () => {
  it("uses configured storage and refinery base prices", () => {
    expect(getStorageServicePrice()).toBe(1);
    expect(getRefineryServicePrice()).toBe(5);
  });

  it("applies relay highland premium to relay service", () => {
    expect(getRelayServicePrice("relay_highland")).toBe(5);
    expect(getRelayServicePrice("safe_zone")).toBe(4);
  });
});
