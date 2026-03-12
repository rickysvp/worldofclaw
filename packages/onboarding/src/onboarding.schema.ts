import { z } from "zod";
import { id_schema, tick_schema } from "../../schemas/src";
import { onboarding_error_codes, onboarding_statuses, onboarding_steps, skill_verification_statuses } from "./constants";
import type { OnboardingSession, SkillVerification, StarterStrategy } from "./onboarding.types";

export const onboarding_status_schema = z.enum(onboarding_statuses);
export const onboarding_step_schema = z.enum(onboarding_steps);
export const onboarding_error_code_schema = z.enum(onboarding_error_codes);
export const skill_verification_status_schema = z.enum(skill_verification_statuses);

export const starter_strategy_schema: z.ZodType<StarterStrategy> = z.object({
  risk_level: z.literal("low"),
  automation_mode: z.literal("conservative"),
  market_mode: z.literal("npc_only"),
  combat_mode: z.literal("avoid")
});

export const skill_verification_schema: z.ZodType<SkillVerification> = z.object({
  skill_id: id_schema,
  status: skill_verification_status_schema,
  capabilities: z.object({
    register: z.boolean(),
    claim: z.boolean(),
    state: z.boolean(),
    jobs: z.boolean(),
    action: z.boolean()
  })
});

const starter_resource_grants_schema = z.object({
  power: z.number().int().min(0),
  scrap: z.number().int().min(0),
  composite: z.number().int().min(0),
  circuit: z.number().int().min(0),
  flux: z.number().int().min(0),
  xenite: z.number().int().min(0),
  compute_core: z.number().int().min(0),
  credits: z.number().int().min(0)
});

export const onboarding_session_schema: z.ZodType<OnboardingSession> = z.object({
  session_id: id_schema,
  user_id: id_schema,
  agent_id: id_schema.nullable(),
  claw_external_id: id_schema.nullable(),
  status: onboarding_status_schema,
  current_step: onboarding_step_schema,
  wallet_connected: z.boolean(),
  skill_verification: skill_verification_schema.nullable(),
  starter_sector_id: id_schema.nullable(),
  starter_facility_ids: z.array(id_schema),
  starter_resource_grants: starter_resource_grants_schema,
  starter_strategy: starter_strategy_schema.nullable(),
  safe_until_tick: tick_schema.nullable(),
  created_at_tick: tick_schema,
  updated_at_tick: tick_schema
});
