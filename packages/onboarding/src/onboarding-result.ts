import type { Agent, Inventory, WorldEvent, WorldState } from "../../schemas/src";
import type { OnboardingEventIntent, OnboardingSession } from "./onboarding.types";

export type OnboardingWorldPatch = {
  session_id: string;
  user_id: string;
  agent: Agent;
  events: WorldEvent[];
  indexes: {
    agent_id: string;
    location: string;
    owner_user_id: string;
    event_ids: string[];
    tick: number;
  };
  ledger_seed: {
    entity_id: string;
    inventory: Inventory;
    credits: number;
  };
};

export type OnboardingWorldApplyResult = {
  world_state: WorldState;
  patch: OnboardingWorldPatch;
  onboarding_events: OnboardingEventIntent[];
  session: OnboardingSession;
};
