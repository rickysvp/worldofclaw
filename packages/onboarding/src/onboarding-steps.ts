import type { OnboardingStatus, OnboardingStep } from "./onboarding.types";

export const onboarding_step_order: OnboardingStep[] = [
  "connect_wallet",
  "bind_claw",
  "verify_skill",
  "assign_spawn",
  "grant_starter_resources",
  "apply_starter_strategy",
  "activate_safe_window",
  "finish"
];

export const onboarding_status_order: OnboardingStatus[] = [
  "uninitialized",
  "wallet_connected",
  "claw_bound",
  "skill_verified",
  "spawn_assigned",
  "starter_resources_granted",
  "starter_strategy_applied",
  "protected_boot",
  "completed"
];

export const canAdvanceStatus = (current_status: OnboardingStatus, next_status: OnboardingStatus): boolean => {
  if (current_status === "failed" || current_status === "completed") {
    return false;
  }

  const current_index = onboarding_status_order.indexOf(current_status);
  const next_index = onboarding_status_order.indexOf(next_status);
  return current_index >= 0 && next_index === current_index + 1;
};
