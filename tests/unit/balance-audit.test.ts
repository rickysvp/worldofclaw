import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { auditBalances } from "../../packages/audit/src";

describe("balance audit", () => {
  it("passes when balances match", () => {
    const result = auditBalances(createDefaultWorldState("balance_seed"));
    expect(result.ok).toBe(true);
  });
});
