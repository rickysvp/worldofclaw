import type { OnboardingSession } from "./onboarding.types";

export const isOnboardingProtected = (session: OnboardingSession, current_tick: number): boolean =>
  session.safe_until_tick !== null && current_tick <= session.safe_until_tick;

export const isOnboardingComplete = (session: OnboardingSession): boolean => session.status === "completed";
