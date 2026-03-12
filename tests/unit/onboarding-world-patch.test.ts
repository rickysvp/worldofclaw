import { describe, expect, it } from "vitest";
import {
  activateProtectedBoot,
  applyStarterStrategy,
  assignSpawn,
  bindClaw,
  connectWallet,
  createOnboardingSession,
  createOnboardingWorldPatch,
  finishOnboarding,
  grantStarterResources,
  verifySkill
} from "../../packages/onboarding/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

const buildCompletedSession = () => {
  const world = createDefaultWorldState("onboarding_patch_seed");
  let session = createOnboardingSession({ session_id: "onboarding_patch", user_id: "user_patch", created_at_tick: 0 });
  session = connectWallet(session, 1).next_session;
  session = bindClaw(session, 2, { agent_id: "agent_patch", claw_external_id: "claw_patch" }).next_session;
  session = verifySkill(session, 3, {
    skill_id: "skill_patch",
    status: "verified",
    capabilities: { register: true, claim: true, state: true, jobs: true, action: true }
  }).next_session;
  session = assignSpawn(session, 4, Object.values(world.registries.sectors)).next_session;
  session = grantStarterResources(session, 5).next_session;
  session = applyStarterStrategy(session, 6).next_session;
  session = activateProtectedBoot(session, 7).next_session;
  session = finishOnboarding(session, 8).next_session;
  return session;
};

describe("onboarding world patch", () => {
  it("creates a world patch with a seeded starter agent", () => {
    const session = buildCompletedSession();
    const patch = createOnboardingWorldPatch({ session, tick: 9, name: "Dust Claw" });

    expect(patch.agent.id).toBe("agent_patch");
    expect(patch.agent.name).toBe("Dust Claw");
    expect(patch.agent.location).toBe(session.starter_sector_id);
    expect(patch.agent.skills).toEqual(["skill_patch"]);
    expect(patch.agent.runtime_flags.safe_until_tick).toBe(session.safe_until_tick ?? 0);
    expect(patch.events[0]?.title).toBe("onboarding_applied");
  });
});
