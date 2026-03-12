import type { OnboardingEventIntent, OnboardingSession } from "./onboarding.types";

export const createOnboardingEvent = (input: {
  code: string;
  tick: number;
  session: OnboardingSession;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
}): OnboardingEventIntent => ({
  code: input.code,
  tick: input.tick,
  session_id: input.session.session_id,
  user_id: input.session.user_id,
  agent_id: input.session.agent_id,
  summary: input.summary,
  metadata: input.metadata ?? {}
});
