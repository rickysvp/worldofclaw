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

describe("onboarding world sync", () => {
  it("syncs completed onboarding into world-state with starter data", () => {
    const world = createDefaultWorldState("onboarding_world_sync_seed");
    let session = createOnboardingSession({ session_id: "onboarding_sync", user_id: "user_sync", created_at_tick: 0 });
    session = connectWallet(session, 1).next_session;
    session = bindClaw(session, 2, { agent_id: "agent_sync", claw_external_id: "claw_sync" }).next_session;
    session = verifySkill(session, 3, {
      skill_id: "skill_sync",
      status: "verified",
      capabilities: { register: true, claim: true, state: true, jobs: true, action: true }
    }).next_session;
    session = assignSpawn(session, 4, Object.values(world.registries.sectors)).next_session;
    session = grantStarterResources(session, 5).next_session;
    session = applyStarterStrategy(session, 6).next_session;
    session = activateProtectedBoot(session, 7).next_session;
    session = finishOnboarding(session, 8).next_session;

    const result = applyOnboardingToWorldState({ world_state: world, session, tick: 9, name: "Sync Agent" });
    const syncedAgent = result.world_state.registries.agents.agent_sync;

    expect(syncedAgent?.location).toBe(session.starter_sector_id);
    expect(syncedAgent?.inventory.power).toBe(8);
    expect(syncedAgent?.inventory.scrap).toBe(2);
    expect(syncedAgent?.runtime_flags.onboarding_completed).toBe(true);
    expect(result.world_state.indexes.events_by_tick["9"]).toContain(result.patch.events[0]!.id);
  });
});
