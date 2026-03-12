import { describe, expect, it } from "vitest";
import { connectWallet, createOnboardingSession, verifySkill } from "../../packages/onboarding/src";

describe("onboarding skill prerequisite", () => {
  it("fails onboarding if the skill is not verified", () => {
    let session = createOnboardingSession({ session_id: "onboarding_skill", user_id: "user_skill", created_at_tick: 0 });
    session = connectWallet(session, 1).next_session;

    const result = verifySkill(session, 2, {
      skill_id: "skill_bad",
      status: "invalid",
      capabilities: { register: true, claim: true, state: true, jobs: true, action: true }
    });

    expect(result.next_session.status).toBe("failed");
    expect(result.events[0]?.code).toBe("onboarding_failed");
  });
});
