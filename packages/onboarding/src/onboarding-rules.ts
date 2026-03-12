import type { Sector } from "../../schemas/src";
import { canAdvanceStatus } from "./onboarding-steps";
import { assignStarterSpawn, createStarterResources, createStarterStrategy } from "./onboarding-defaults";
import { createOnboardingEvent } from "./onboarding-events";
import { getOnboardingSafeUntilTick, updateOnboardingSession } from "./onboarding-state";
import { validateClawBinding, validateCompletion, validateSkillVerification, validateSpawnAssignment, validateWalletConnection } from "./onboarding-validation";
import type { OnboardingSession, OnboardingTransition, SkillVerification } from "./onboarding.types";

const invalidTransition = (session: OnboardingSession, tick: number, summary: string): OnboardingTransition => ({
  next_session: updateOnboardingSession(session, { status: "failed" }, tick),
  events: [createOnboardingEvent({ code: "onboarding_failed", tick, session, summary })]
});

export const connectWallet = (session: OnboardingSession, tick: number): OnboardingTransition => {
  const result = validateWalletConnection(true);
  if (!result.ok || !canAdvanceStatus(session.status, "wallet_connected")) {
    return invalidTransition(session, tick, "Wallet connection failed during onboarding");
  }

  const next_session = updateOnboardingSession(session, { wallet_connected: true, status: "wallet_connected" }, tick);
  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_wallet_connected", tick, session: next_session, summary: "Wallet connected for onboarding" })]
  };
};

export const bindClaw = (
  session: OnboardingSession,
  tick: number,
  input: { agent_id: string; claw_external_id: string }
): OnboardingTransition => {
  const result = validateClawBinding(input);
  if (!result.ok || !canAdvanceStatus(session.status, "claw_bound")) {
    return invalidTransition(session, tick, "Claw binding failed during onboarding");
  }

  const next_session = updateOnboardingSession(
    session,
    {
      agent_id: input.agent_id,
      claw_external_id: input.claw_external_id,
      status: "claw_bound"
    },
    tick
  );

  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_claw_bound", tick, session: next_session, summary: "OpenClaw bound to onboarding session" })]
  };
};

export const verifySkill = (session: OnboardingSession, tick: number, skill_verification: SkillVerification): OnboardingTransition => {
  const result = validateSkillVerification(skill_verification);
  if (!result.ok || !canAdvanceStatus(session.status, "skill_verified")) {
    return invalidTransition(session, tick, "Skill verification failed during onboarding");
  }

  const next_session = updateOnboardingSession(session, { skill_verification, status: "skill_verified" }, tick);
  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_skill_verified", tick, session: next_session, summary: "Skill verification completed" })]
  };
};

export const assignSpawn = (session: OnboardingSession, tick: number, sectors: ReadonlyArray<Sector>): OnboardingTransition => {
  const result = validateSpawnAssignment(sectors);
  const starter_sector_id = assignStarterSpawn(sectors);
  if (!result.ok || starter_sector_id === null || !canAdvanceStatus(session.status, "spawn_assigned")) {
    return invalidTransition(session, tick, "Spawn assignment failed during onboarding");
  }

  const next_session = updateOnboardingSession(session, { starter_sector_id, status: "spawn_assigned" }, tick);
  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_spawn_assigned", tick, session: next_session, summary: "Starter spawn assigned", metadata: { starter_sector_id } })]
  };
};

export const grantStarterResources = (session: OnboardingSession, tick: number): OnboardingTransition => {
  if (!canAdvanceStatus(session.status, "starter_resources_granted")) {
    return invalidTransition(session, tick, "Starter resources could not be granted");
  }

  const starter_resource_grants = createStarterResources();
  const next_session = updateOnboardingSession(session, { starter_resource_grants, status: "starter_resources_granted" }, tick);
  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_starter_resources_granted", tick, session: next_session, summary: "Starter resources granted" })]
  };
};

export const applyStarterStrategy = (session: OnboardingSession, tick: number): OnboardingTransition => {
  if (!canAdvanceStatus(session.status, "starter_strategy_applied")) {
    return invalidTransition(session, tick, "Starter strategy could not be applied");
  }

  const starter_strategy = createStarterStrategy();
  const next_session = updateOnboardingSession(session, { starter_strategy, status: "starter_strategy_applied" }, tick);
  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_starter_strategy_applied", tick, session: next_session, summary: "Starter strategy applied" })]
  };
};

export const activateProtectedBoot = (session: OnboardingSession, tick: number): OnboardingTransition => {
  if (!canAdvanceStatus(session.status, "protected_boot")) {
    return invalidTransition(session, tick, "Protected boot could not be activated");
  }

  const safe_until_tick = getOnboardingSafeUntilTick(tick);
  const next_session = updateOnboardingSession(session, { safe_until_tick, status: "protected_boot" }, tick);
  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_protected_boot", tick, session: next_session, summary: "Protected boot activated", metadata: { safe_until_tick } })]
  };
};

export const finishOnboarding = (session: OnboardingSession, tick: number): OnboardingTransition => {
  const result = validateCompletion(session);
  if (!result.ok || !canAdvanceStatus(session.status, "completed")) {
    return invalidTransition(session, tick, "Onboarding could not be completed");
  }

  const next_session = updateOnboardingSession(session, { status: "completed" }, tick);
  return {
    next_session,
    events: [createOnboardingEvent({ code: "onboarding_completed", tick, session: next_session, summary: "Onboarding completed" })]
  };
};
