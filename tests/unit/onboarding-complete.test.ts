import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import {
  activateProtectedBoot,
  applyStarterStrategy,
  assignSpawn,
  bindClaw,
  connectWallet,
  createOnboardingSession,
  finishOnboarding,
  grantStarterResources,
  isOnboardingComplete,
  isOnboardingProtected,
  verifySkill
} from "../../packages/onboarding/src";

describe("onboarding completion", () => {
  it("completes a fully prepared onboarding session", () => {
    const world = createDefaultWorldState("onboarding_complete_seed");
    let session = createOnboardingSession({ session_id: "onboarding_1", user_id: "user_1", created_at_tick: 0 });
    session = connectWallet(session, 1).next_session;
    session = bindClaw(session, 2, { agent_id: "agent_1", claw_external_id: "claw_1" }).next_session;
    session = verifySkill(session, 3, {
      skill_id: "skill_1",
      status: "verified",
      capabilities: { register: true, claim: true, state: true, jobs: true, action: true }
    }).next_session;
    session = assignSpawn(session, 4, Object.values(world.registries.sectors)).next_session;
    session = grantStarterResources(session, 5).next_session;
    session = applyStarterStrategy(session, 6).next_session;
    session = activateProtectedBoot(session, 7).next_session;

    const completed = finishOnboarding(session, 8).next_session;
    expect(isOnboardingComplete(completed)).toBe(true);
    expect(isOnboardingProtected(completed, 8)).toBe(true);
  });
});
