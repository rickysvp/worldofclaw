import { agent_schema, event_schema, type Agent, type Inventory, type WorldEvent } from "../../schemas/src";
import { createStarterStrategy } from "./onboarding-defaults";
import type { OnboardingSession } from "./onboarding.types";
import type { OnboardingWorldPatch } from "./onboarding-result";

const starter_agent_defaults = {
  power_max: 20,
  durability_max: 20,
  compute_max: 2,
  cargo_max: 20,
  shelter_level: 1,
  access_level: 1
} as const;

const createOnboardingWorldEvent = (input: {
  event_id: string;
  tick: number;
  agent_id: string;
  sector_id: string;
  session_id: string;
}): WorldEvent =>
  event_schema.parse({
    id: input.event_id,
    version: 1,
    created_at_tick: input.tick,
    updated_at_tick: input.tick,
    tick: input.tick,
    kind: "system",
    level: "info",
    action: null,
    source_entity_id: null,
    target_entity_id: input.agent_id,
    sector_id: input.sector_id,
    title: "onboarding_applied",
    message: "Onboarding starter state applied to world state.",
    error_code: null,
    payload: {
      session_id: input.session_id,
      protected_boot: true
    }
  });

export const createOnboardingAgent = (input: {
  session: OnboardingSession;
  tick: number;
  name?: string;
}): Agent => {
  if (!input.session.agent_id || !input.session.starter_sector_id) {
    throw new Error("onboarding session is missing an agent id or starter sector");
  }

  const starter_strategy = input.session.starter_strategy ?? createStarterStrategy();
  const inventory: Inventory = {
    ...input.session.starter_resource_grants,
    power: input.session.starter_resource_grants.power,
    credits: input.session.starter_resource_grants.credits
  };

  return agent_schema.parse({
    id: input.session.agent_id,
    version: 1,
    created_at_tick: input.tick,
    updated_at_tick: input.tick,
    owner_user_id: input.session.user_id,
    external_agent_id: input.session.claw_external_id,
    name: input.name ?? input.session.agent_id,
    location: input.session.starter_sector_id,
    status: "idle",
    power: input.session.starter_resource_grants.power,
    power_max: starter_agent_defaults.power_max,
    durability: starter_agent_defaults.durability_max,
    durability_max: starter_agent_defaults.durability_max,
    compute: starter_agent_defaults.compute_max,
    compute_max: starter_agent_defaults.compute_max,
    cargo_used: 0,
    cargo_max: starter_agent_defaults.cargo_max,
    credits: input.session.starter_resource_grants.credits,
    trust: 0,
    threat: 0,
    bond: 0,
    shelter_level: starter_agent_defaults.shelter_level,
    access_level: starter_agent_defaults.access_level,
    inventory,
    skills: input.session.skill_verification ? [input.session.skill_verification.skill_id] : [],
    affiliations: [],
    runtime_flags: {
      onboarding_session_id: input.session.session_id,
      onboarding_completed: input.session.status === "completed",
      safe_until_tick: input.session.safe_until_tick ?? 0,
      starter_strategy_risk_level: starter_strategy.risk_level,
      starter_strategy_automation_mode: starter_strategy.automation_mode,
      starter_strategy_market_mode: starter_strategy.market_mode,
      starter_strategy_combat_mode: starter_strategy.combat_mode
    }
  });
};

export const createOnboardingWorldPatch = (input: {
  session: OnboardingSession;
  tick: number;
  name?: string;
}): OnboardingWorldPatch => {
  if (input.session.status !== "completed") {
    throw new Error("onboarding session must be completed before it can be applied to world state");
  }

  if (!input.session.agent_id || !input.session.starter_sector_id) {
    throw new Error("onboarding session is missing required world sync fields");
  }

  const agent = createOnboardingAgent(
    input.name === undefined
      ? { session: input.session, tick: input.tick }
      : { session: input.session, tick: input.tick, name: input.name }
  );
  const event_id = `event_onboarding_${input.session.session_id}_${input.tick}`;
  const event = createOnboardingWorldEvent({
    event_id,
    tick: input.tick,
    agent_id: input.session.agent_id,
    sector_id: input.session.starter_sector_id,
    session_id: input.session.session_id
  });

  return {
    session_id: input.session.session_id,
    user_id: input.session.user_id,
    agent,
    events: [event],
    indexes: {
      agent_id: agent.id,
      location: agent.location,
      owner_user_id: input.session.user_id,
      event_ids: [event_id],
      tick: input.tick
    },
    ledger_seed: {
      entity_id: agent.id,
      inventory: agent.inventory,
      credits: agent.credits
    }
  };
};
