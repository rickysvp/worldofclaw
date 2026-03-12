import { describe, expect, it } from "vitest";
import { evaluateRateLimit } from "../../packages/risk/src";

describe("rate limit", () => {
  it("warns near cap and throttles over cap", () => {
    expect(evaluateRateLimit(10, 9).action).toBe("warning");
    expect(evaluateRateLimit(10, 11).allowed).toBe(false);
  });
});
