import { describe, expect, it } from "vitest";
import { getActionPowerCostRule } from "../../packages/rules/src";

describe("action costs", () => {
  it("defines deterministic action power costs", () => {
    expect(getActionPowerCostRule("move")).toBe(1);
    expect(getActionPowerCostRule("mine_meteor")).toBe(2);
    expect(getActionPowerCostRule("trade")).toBe(0);
  });
});
