import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { reconcileLedger } from "../../packages/audit/src";

describe("ledger reconcile", () => {
  it("reconciles a clean world ledger", () => {
    const result = reconcileLedger(createDefaultWorldState("ledger_seed"));
    expect(result.balanced).toBe(true);
    expect(result.issues).toHaveLength(0);
  });
});
