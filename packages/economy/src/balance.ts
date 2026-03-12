import type { Facility, WorldState } from "../../schemas/src";
import { platform_treasury_entity_id } from "./constants";

export const ensureIntegerCredits = (value: number): number => {
  if (!Number.isInteger(value)) {
    throw new Error("credits_must_be_integer");
  }
  return value;
};

export const canAffordCredits = (current: number, cost: number): boolean => current >= cost;

const getCurrentCredits = (world_state: WorldState, entity_id: string): number => {
  const agent = world_state.registries.agents[entity_id];
  if (agent) {
    return agent.credits;
  }

  const facility: Facility | undefined = world_state.registries.facilities[entity_id];
  if (facility) {
    return facility.inventory.credits;
  }

  return world_state.ledgers.credits_balances_by_entity[entity_id] ?? 0;
};

export const canApplyCreditsDelta = (world_state: WorldState, entity_id: string, credits_delta: number): boolean =>
  credits_delta >= 0 || getCurrentCredits(world_state, entity_id) + credits_delta >= 0;

export const canApplySettlementPostings = (
  world_state: WorldState,
  postings: ReadonlyArray<{ entity_id: string; credits_delta: number }>
): boolean => {
  const working_balances: Record<string, number> = {};

  for (const posting of postings) {
    const current =
      working_balances[posting.entity_id] ??
      getCurrentCredits(world_state, posting.entity_id);
    const next = current + posting.credits_delta;
    if (next < 0) {
      return false;
    }
    working_balances[posting.entity_id] = next;
  }

  return true;
};

export const applyCreditsDelta = (world_state: WorldState, entity_id: string, credits_delta: number): WorldState => {
  ensureIntegerCredits(credits_delta);
  if (!canApplyCreditsDelta(world_state, entity_id, credits_delta)) {
    throw new Error(`credits_overdraft:${entity_id}`);
  }

  const agent = world_state.registries.agents[entity_id];
  if (agent) {
    agent.credits += credits_delta;
    agent.inventory.credits = agent.credits;
    return world_state;
  }

  const facility: Facility | undefined = world_state.registries.facilities[entity_id];
  if (facility) {
    facility.inventory.credits = Math.max(0, facility.inventory.credits + credits_delta);
    return world_state;
  }

  const current = world_state.ledgers.credits_balances_by_entity[entity_id] ?? 0;
  world_state.ledgers.credits_balances_by_entity[entity_id] = current + credits_delta;
  if (entity_id === platform_treasury_entity_id && !world_state.ledgers.resource_balances_by_entity[entity_id]) {
    world_state.ledgers.resource_balances_by_entity[entity_id] = {
      power: 0,
      scrap: 0,
      composite: 0,
      circuit: 0,
      flux: 0,
      xenite: 0,
      compute_core: 0,
      credits: world_state.ledgers.credits_balances_by_entity[entity_id]
    };
  }
  return world_state;
};
