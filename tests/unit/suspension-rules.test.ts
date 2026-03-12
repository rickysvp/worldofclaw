import { describe, expect, it } from "vitest";
import { evaluateSuspension } from "../../packages/risk/src";

describe("suspension rules", () => {
  it("downgrades, suspends, and bans based on escalation", () => {
    expect(evaluateSuspension({ dispute_count: 0, severe_breach_count: 0, repeated_overage_count: 2 }).action).toBe("feature_downgrade");
    expect(evaluateSuspension({ dispute_count: 2, severe_breach_count: 0, repeated_overage_count: 0 }).action).toBe("suspend");
    expect(evaluateSuspension({ dispute_count: 0, severe_breach_count: 3, repeated_overage_count: 0 }).action).toBe("ban");
  });
});
