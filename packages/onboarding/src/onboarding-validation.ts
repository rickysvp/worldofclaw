import type { Sector } from "../../schemas/src";
import type { OnboardingErrorCode, OnboardingSession, OnboardingValidationResult, SkillVerification } from "./onboarding.types";

const ok = (): OnboardingValidationResult => ({ ok: true, error_code: null });
const fail = (error_code: OnboardingErrorCode): OnboardingValidationResult => ({ ok: false, error_code });

export const validateWalletConnection = (wallet_connected: boolean): OnboardingValidationResult =>
  wallet_connected ? ok() : fail("ONBOARDING_WALLET_REQUIRED");

export const validateClawBinding = (input: {
  agent_id: string | null;
  claw_external_id: string | null;
}): OnboardingValidationResult =>
  input.agent_id && input.claw_external_id ? ok() : input.agent_id ? fail("ONBOARDING_CLAW_REQUIRED") : fail("ONBOARDING_AGENT_REQUIRED");

export const validateSkillVerification = (skill_verification: SkillVerification | null): OnboardingValidationResult => {
  if (!skill_verification) {
    return fail("ONBOARDING_SKILL_REQUIRED");
  }

  if (
    skill_verification.status !== "verified" ||
    !skill_verification.capabilities.register ||
    !skill_verification.capabilities.claim ||
    !skill_verification.capabilities.state ||
    !skill_verification.capabilities.action
  ) {
    return fail("ONBOARDING_SKILL_INVALID");
  }

  return ok();
};

export const validateSpawnAssignment = (sectors: ReadonlyArray<Sector>): OnboardingValidationResult =>
  sectors.some((sector) => sector.terrain_type === "safe_zone" && !sector.blocked) ? ok() : fail("ONBOARDING_SPAWN_UNAVAILABLE");

export const validateCompletion = (session: OnboardingSession): OnboardingValidationResult => {
  if (session.status === "completed") {
    return fail("ONBOARDING_ALREADY_COMPLETED");
  }

  return session.wallet_connected &&
    session.agent_id !== null &&
    session.claw_external_id !== null &&
    session.skill_verification?.status === "verified" &&
    session.starter_sector_id !== null &&
    session.starter_strategy !== null &&
    session.safe_until_tick !== null
    ? ok()
    : fail("ONBOARDING_INVALID_TRANSITION");
};
