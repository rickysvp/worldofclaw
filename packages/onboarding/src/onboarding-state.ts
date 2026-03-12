import { onboarding_safe_window_ticks, starter_resource_defaults } from "./constants";
import type { OnboardingSession, OnboardingStatus } from "./onboarding.types";

const next_step_by_status: Record<OnboardingStatus, OnboardingSession["current_step"]> = {
  uninitialized: "connect_wallet",
  wallet_connected: "bind_claw",
  claw_bound: "verify_skill",
  skill_verified: "assign_spawn",
  spawn_assigned: "grant_starter_resources",
  starter_resources_granted: "apply_starter_strategy",
  starter_strategy_applied: "activate_safe_window",
  protected_boot: "finish",
  completed: "finish",
  failed: "finish"
};

export const createOnboardingSession = (input: {
  session_id: string;
  user_id: string;
  created_at_tick: number;
}): OnboardingSession => ({
  session_id: input.session_id,
  user_id: input.user_id,
  agent_id: null,
  claw_external_id: null,
  status: "uninitialized",
  current_step: "connect_wallet",
  wallet_connected: false,
  skill_verification: null,
  starter_sector_id: null,
  starter_facility_ids: [],
  starter_resource_grants: { ...starter_resource_defaults },
  starter_strategy: null,
  safe_until_tick: null,
  created_at_tick: input.created_at_tick,
  updated_at_tick: input.created_at_tick
});

export const updateOnboardingSession = (
  session: OnboardingSession,
  patch: Partial<OnboardingSession>,
  tick: number
): OnboardingSession => {
  const next_status = patch.status ?? session.status;
  return {
    ...session,
    ...patch,
    current_step: next_step_by_status[next_status],
    updated_at_tick: tick
  };
};

export const getOnboardingSafeUntilTick = (current_tick: number): number => current_tick + onboarding_safe_window_ticks;
