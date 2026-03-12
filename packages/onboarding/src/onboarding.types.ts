import type { z } from "zod";
import type { Inventory, Sector } from "../../schemas/src";
import type {
  onboarding_error_codes,
  onboarding_statuses,
  onboarding_steps,
  skill_verification_statuses,
  starter_strategy_defaults
} from "./constants";

export type OnboardingStatus = (typeof onboarding_statuses)[number];
export type OnboardingStep = (typeof onboarding_steps)[number];
export type OnboardingErrorCode = (typeof onboarding_error_codes)[number];
export type SkillVerificationStatus = (typeof skill_verification_statuses)[number];

export type StarterStrategy = {
  risk_level: typeof starter_strategy_defaults.risk_level;
  automation_mode: typeof starter_strategy_defaults.automation_mode;
  market_mode: typeof starter_strategy_defaults.market_mode;
  combat_mode: typeof starter_strategy_defaults.combat_mode;
};

export type SkillVerification = {
  skill_id: string;
  status: SkillVerificationStatus;
  capabilities: {
    register: boolean;
    claim: boolean;
    state: boolean;
    jobs: boolean;
    action: boolean;
  };
};

export type OnboardingSession = {
  session_id: string;
  user_id: string;
  agent_id: string | null;
  claw_external_id: string | null;
  status: OnboardingStatus;
  current_step: OnboardingStep;
  wallet_connected: boolean;
  skill_verification: SkillVerification | null;
  starter_sector_id: string | null;
  starter_facility_ids: string[];
  starter_resource_grants: Inventory;
  starter_strategy: StarterStrategy | null;
  safe_until_tick: number | null;
  created_at_tick: number;
  updated_at_tick: number;
};

export type OnboardingEventIntent = {
  code: string;
  tick: number;
  session_id: string;
  user_id: string;
  agent_id: string | null;
  summary: string;
  metadata: Record<string, string | number | boolean>;
};

export type OnboardingTransition = {
  next_session: OnboardingSession;
  events: OnboardingEventIntent[];
};

export type OnboardingValidationResult =
  | {
      ok: true;
      error_code: null;
    }
  | {
      ok: false;
      error_code: OnboardingErrorCode;
    };

export type SpawnAssignmentInput = {
  sectors: ReadonlyArray<Sector>;
};

export type ZodSchemaType<T> = z.ZodType<T>;
