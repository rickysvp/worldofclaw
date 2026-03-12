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
  verifySkill
} from "../../packages/onboarding/src";

describe("first agent onboarding smoke", () => {
  it("completes first agent onboarding end to end", () => {
    const world = createDefaultWorldState("first_agent_onboarding");
    let session = createOnboardingSession({ session_id: "onboarding_smoke", user_id: "user_smoke", created_at_tick: 0 });

    session = connectWallet(session, 1).next_session;
    session = bindClaw(session, 2, { agent_id: "agent_smoke", claw_external_id: "claw_smoke" }).next_session;
    session = verifySkill(session, 3, {
      skill_id: "skill_smoke",
      status: "verified",
      capabilities: { register: true, claim: true, state: true, jobs: true, action: true }
    }).next_session;
    session = assignSpawn(session, 4, Object.values(world.registries.sectors)).next_session;
    session = grantStarterResources(session, 5).next_session;
    session = applyStarterStrategy(session, 6).next_session;
    session = activateProtectedBoot(session, 7).next_session;
    session = finishOnboarding(session, 8).next_session;

    expect(session.status).toBe("completed");
    expect(session.agent_id).toBe("agent_smoke");
    expect(session.starter_sector_id).toBeTruthy();
    expect(session.starter_resource_grants.power).toBe(8);
  });
});
