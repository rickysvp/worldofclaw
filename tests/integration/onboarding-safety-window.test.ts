import { describe, expect, it } from "vitest";
import { createOnboardingSession, getOnboardingSafeUntilTick, isOnboardingProtected } from "../../packages/onboarding/src";

describe("onboarding safety window", () => {
  it("marks onboarding sessions as protected within the safe window", () => {
    const session = {
      ...createOnboardingSession({ session_id: "onboarding_safe", user_id: "user_safe", created_at_tick: 0 }),
      status: "protected_boot" as const,
      safe_until_tick: getOnboardingSafeUntilTick(10)
    };

    expect(isOnboardingProtected(session, 10)).toBe(true);
    expect(isOnboardingProtected(session, session.safe_until_tick + 1)).toBe(false);
  });
});
