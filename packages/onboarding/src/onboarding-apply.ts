import { validateWorldState, type WorldState } from "../../schemas/src";
import { createOnboardingWorldPatch } from "./onboarding-world-patch";
import type { OnboardingSession } from "./onboarding.types";
import type { OnboardingWorldApplyResult } from "./onboarding-result";

const appendUnique = (values: ReadonlyArray<string>, next_value: string): string[] =>
  values.includes(next_value) ? [...values] : [...values, next_value];

export const applyOnboardingToWorldState = (input: {
  world_state: WorldState;
  session: OnboardingSession;
  tick: number;
  name?: string;
}): OnboardingWorldApplyResult => {
  const patch = createOnboardingWorldPatch(
    input.name === undefined
      ? { session: input.session, tick: input.tick }
      : { session: input.session, tick: input.tick, name: input.name }
  );
  const next_world_state = structuredClone(input.world_state);

  next_world_state.meta.updated_at_tick = input.tick;
  next_world_state.registries.agents[patch.agent.id] = patch.agent;

  for (const event of patch.events) {
    next_world_state.registries.events[event.id] = event;
  }

  next_world_state.indexes.agent_ids = appendUnique(next_world_state.indexes.agent_ids, patch.agent.id);
  next_world_state.indexes.event_ids = [...new Set([...next_world_state.indexes.event_ids, ...patch.indexes.event_ids])];
  next_world_state.indexes.agents_by_owner_user_id[patch.indexes.owner_user_id] = appendUnique(
    next_world_state.indexes.agents_by_owner_user_id[patch.indexes.owner_user_id] ?? [],
    patch.agent.id
  );
  next_world_state.indexes.agents_by_location[patch.indexes.location] = appendUnique(
    next_world_state.indexes.agents_by_location[patch.indexes.location] ?? [],
    patch.agent.id
  );
  next_world_state.indexes.events_by_tick[String(input.tick)] = [
    ...(next_world_state.indexes.events_by_tick[String(input.tick)] ?? []),
    ...patch.indexes.event_ids
  ];

  next_world_state.ledgers.resource_balances_by_entity[patch.ledger_seed.entity_id] = patch.ledger_seed.inventory;
  next_world_state.ledgers.credits_balances_by_entity[patch.ledger_seed.entity_id] = patch.ledger_seed.credits;

  const validation = validateWorldState(next_world_state);
  if (!validation.ok) {
    throw new Error(`failed to apply onboarding world patch: ${validation.errors.map((issue) => `${issue.path}:${issue.message}`).join(", ")}`);
  }

  return {
    world_state: validation.data,
    patch,
    onboarding_events: [
      {
        code: "onboarding_world_patch_applied",
        tick: input.tick,
        session_id: input.session.session_id,
        user_id: input.session.user_id,
        agent_id: patch.agent.id,
        summary: "Onboarding patch applied to world state",
        metadata: {
          starter_sector_id: patch.agent.location,
          safe_until_tick: Number(patch.agent.runtime_flags.safe_until_tick ?? 0)
        }
      }
    ],
    session: input.session
  };
};
