import { describe, expect, it } from "vitest";
import {
  activateProtectedBoot,
  applyOnboardingToWorldState,
  applyStarterStrategy,
  assignSpawn,
  bindClaw,
  connectWallet,
  createOnboardingSession,
  finishOnboarding,
  grantStarterResources,
  verifySkill
} from "../../packages/onboarding/src";
import { createDefaultWorldState } from "../../packages/schemas/src";

const buildCompletedSession = (world = createDefaultWorldState("onboarding_apply_seed")) => {
  let session = createOnboardingSession({ session_id: "onboarding_apply", user_id: "user_apply", created_at_tick: 0 });
  session = connectWallet(session, 1).next_session;
  session = bindClaw(session, 2, { agent_id: "agent_apply", claw_external_id: "claw_apply" }).next_session;
  session = verifySkill(session, 3, {
    skill_id: "skill_apply",
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

describe("onboarding apply", () => {
  it("applies onboarding state to the world registries and indexes", () => {
    const world = createDefaultWorldState("onboarding_apply_world_seed");
    const session = buildCompletedSession(world);
    const result = applyOnboardingToWorldState({ world_state: world, session, tick: 9, name: "Patch Agent" });

    expect(result.world_state.registries.agents.agent_apply?.name).toBe("Patch Agent");
    expect(result.world_state.indexes.agent_ids).toContain("agent_apply");
    expect(result.world_state.indexes.agents_by_owner_user_id.user_apply).toContain("agent_apply");
    expect(result.world_state.indexes.agents_by_location[result.patch.agent.location]).toContain("agent_apply");
    expect(result.world_state.ledgers.credits_balances_by_entity.agent_apply).toBe(10);
  });
});
