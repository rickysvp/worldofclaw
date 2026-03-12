import type { Agent, Facility, Inventory, LedgerEntry, ResourceType, Sector, WorldState } from "../../../schemas/src";
import { cloneState } from "./clone-state";
import type { TickAccumulator } from "../tick-context";

const default_inventory = (): Inventory => ({
  power: 0,
  scrap: 0,
  composite: 0,
  circuit: 0,
  flux: 0,
  xenite: 0,
  compute_core: 0,
  credits: 0
});

const inventory_from_agent = (agent: Agent): Inventory => ({
  ...agent.inventory,
  power: agent.power,
  credits: agent.credits
});

const inventory_from_facility = (facility: Facility): Inventory => ({
  ...facility.inventory,
  power: facility.power_buffer
});

const inventory_from_sector = (sector: Sector): Inventory => ({
  ...sector.resource_stock
});

const get_entity_inventory_snapshot = (world_state: WorldState, entity_id: string): Inventory => {
  const agent = world_state.registries.agents[entity_id];
  if (agent) {
    return inventory_from_agent(agent);
  }

  const facility = world_state.registries.facilities[entity_id];
  if (facility) {
    return inventory_from_facility(facility);
  }

  const sector = world_state.registries.sectors[entity_id];
  if (sector) {
    return inventory_from_sector(sector);
  }

  return world_state.ledgers.resource_balances_by_entity[entity_id] ?? default_inventory();
};

const get_entity_credit_balance = (world_state: WorldState, entity_id: string): number => {
  const agent = world_state.registries.agents[entity_id];
  if (agent) {
    return agent.credits;
  }

  const facility = world_state.registries.facilities[entity_id];
  if (facility) {
    return facility.inventory.credits;
  }

  const sector = world_state.registries.sectors[entity_id];
  if (sector) {
    return sector.resource_stock.credits;
  }

  return world_state.ledgers.credits_balances_by_entity[entity_id] ?? 0;
};

const sync_entity_ledger_state = (world_state: WorldState, entity_id: string) => {
  const next_inventory = get_entity_inventory_snapshot(world_state, entity_id);
  const next_credits = get_entity_credit_balance(world_state, entity_id);
  world_state.ledgers.resource_balances_by_entity[entity_id] = next_inventory;
  world_state.ledgers.credits_balances_by_entity[entity_id] = next_credits;
};

export const synchronizeLedgerState = (world_state: WorldState): WorldState => {
  const next = cloneState(world_state);
  const preserved_resource_balances = { ...next.ledgers.resource_balances_by_entity };
  const preserved_credit_balances = { ...next.ledgers.credits_balances_by_entity };
  next.ledgers.resource_balances_by_entity = {};
  next.ledgers.credits_balances_by_entity = {};

  for (const entity_id of Object.keys(next.registries.sectors)) {
    sync_entity_ledger_state(next, entity_id);
  }
  for (const entity_id of Object.keys(next.registries.facilities)) {
    sync_entity_ledger_state(next, entity_id);
  }
  for (const entity_id of Object.keys(next.registries.agents)) {
    sync_entity_ledger_state(next, entity_id);
  }

  for (const [entity_id, inventory] of Object.entries(preserved_resource_balances)) {
    if (!next.ledgers.resource_balances_by_entity[entity_id]) {
      next.ledgers.resource_balances_by_entity[entity_id] = inventory;
    }
  }

  for (const [entity_id, credits] of Object.entries(preserved_credit_balances)) {
    if (next.ledgers.credits_balances_by_entity[entity_id] === undefined) {
      next.ledgers.credits_balances_by_entity[entity_id] = credits;
    }
  }

  return next;
};

export const appendLedgerEntry = (
  accumulator: TickAccumulator,
  input: Omit<LedgerEntry, "id">
): TickAccumulator => {
  const world_state = cloneState(accumulator.world_state);
  const next_ledger_counter = accumulator.ledger_counter + 1;
  const id = `ledger_${input.tick}_${String(next_ledger_counter).padStart(4, "0")}`;

  let balance_after = 0;
  if (input.resource_type) {
    sync_entity_ledger_state(world_state, input.entity_id);
    balance_after = world_state.ledgers.resource_balances_by_entity[input.entity_id]?.[input.resource_type] ?? 0;
  } else {
    sync_entity_ledger_state(world_state, input.entity_id);
    balance_after = world_state.ledgers.credits_balances_by_entity[input.entity_id] ?? 0;
  }

  const entry: LedgerEntry = {
    ...input,
    id,
    payload: {
      ...input.payload,
      balance_after
    }
  };

  world_state.ledgers.entries = [...world_state.ledgers.entries, entry];

  return {
    ...accumulator,
    world_state,
    ledger_counter: next_ledger_counter,
    created_ledger_entries: [...accumulator.created_ledger_entries, entry]
  };
};
