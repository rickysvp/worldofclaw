import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import {
  activateProtectedBoot,
  applyStarterStrategy,
  assignSpawn,
  bindClaw,
  connectWallet,
  createOnboardingSession,
  grantStarterResources,
  verifySkill
} from "../../packages/onboarding/src";

describe("onboarding rules", () => {
  it("advances through the onboarding steps in order", () => {
    const world = createDefaultWorldState("onboarding_rules_seed");
    let session = createOnboardingSession({ session_id: "onboarding_1", user_id: "user_1", created_at_tick: 0 });

    session = connectWallet(session, 1).next_session;
    expect(session.status).toBe("wallet_connected");

    session = bindClaw(session, 2, { agent_id: "agent_1", claw_external_id: "claw_1" }).next_session;
    expect(session.status).toBe("claw_bound");

    session = verifySkill(session, 3, {
      skill_id: "skill_1",
      status: "verified",
      capabilities: { register: true, claim: true, state: true, jobs: true, action: true }
    }).next_session;
    expect(session.status).toBe("skill_verified");

    session = assignSpawn(session, 4, Object.values(world.registries.sectors)).next_session;
    expect(session.status).toBe("spawn_assigned");

    session = grantStarterResources(session, 5).next_session;
    expect(session.status).toBe("starter_resources_granted");

    session = applyStarterStrategy(session, 6).next_session;
    expect(session.status).toBe("starter_strategy_applied");

    session = activateProtectedBoot(session, 7).next_session;
    expect(session.status).toBe("protected_boot");
    expect(session.safe_until_tick).toBeGreaterThan(7);
  });
});
