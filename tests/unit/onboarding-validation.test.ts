import { describe, expect, it } from "vitest";
import { createDefaultWorldState } from "../../packages/schemas/src";
import { validateClawBinding, validateCompletion, validateSkillVerification, validateSpawnAssignment, validateWalletConnection, createOnboardingSession } from "../../packages/onboarding/src";

describe("onboarding validation", () => {
  it("requires wallet connection", () => {
    expect(validateWalletConnection(false)).toEqual({ ok: false, error_code: "ONBOARDING_WALLET_REQUIRED" });
  });

  it("requires both agent and claw binding", () => {
    expect(validateClawBinding({ agent_id: null, claw_external_id: null })).toEqual({ ok: false, error_code: "ONBOARDING_AGENT_REQUIRED" });
    expect(validateClawBinding({ agent_id: "agent_1", claw_external_id: null })).toEqual({ ok: false, error_code: "ONBOARDING_CLAW_REQUIRED" });
  });

  it("requires a verified skill with minimum capabilities", () => {
    expect(validateSkillVerification(null)).toEqual({ ok: false, error_code: "ONBOARDING_SKILL_REQUIRED" });
    expect(validateSkillVerification({
      skill_id: "skill_1",
      status: "invalid",
      capabilities: { register: true, claim: true, state: true, jobs: true, action: true }
    })).toEqual({ ok: false, error_code: "ONBOARDING_SKILL_INVALID" });
  });

  it("requires a safe-zone spawn", () => {
    const world = createDefaultWorldState("onboarding_spawn_validation");
    expect(validateSpawnAssignment(Object.values(world.registries.sectors))).toEqual({ ok: true, error_code: null });
  });

  it("rejects completion if required steps are missing", () => {
    const session = createOnboardingSession({ session_id: "onboarding_1", user_id: "user_1", created_at_tick: 0 });
    expect(validateCompletion(session)).toEqual({ ok: false, error_code: "ONBOARDING_INVALID_TRANSITION" });
  });
});
