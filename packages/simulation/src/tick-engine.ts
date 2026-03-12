import {
  validateWorldState,
  world_state_schema,
  type Agent,
  type WorldState
} from "../../schemas/src";
import { createDeterministicRandom } from "./random";
import { createTickContext, createInitialAccumulator, type PendingAction, type ProcessedTickReceipt, type TickEngineResult } from "./tick-context";
import { guardActionQueue, guardDuplicateTick, guardTickProgression, createIdempotencyKey } from "./guards";
import { createActionQueueChecksum, createReceiptChecksum, createWorldChecksum } from "./snapshot";
import { tick_phase_order } from "./tick-phases";
import { environmentReducer } from "./reducers/environment.reducer";
import { resourceRefreshReducer } from "./reducers/resource-refresh.reducer";
import { agentUpkeepReducer } from "./reducers/agent-upkeep.reducer";
import { actionResolutionReducer } from "./reducers/action-resolution.reducer";
import { relationReducer } from "./reducers/relation.reducer";
import { eventEmissionReducer } from "./reducers/event-emission.reducer";
import { diffState } from "./utils/diff-state";
import { cloneState } from "./utils/clone-state";
import { synchronizeLedgerState } from "./utils/ledger-helper";
import { buildNeighborSectorIndex } from "./map/sector-graph";
import { synchronizeSectorOccupants } from "./map/sector-state.helpers";
import { buildFacilityCoverageIndex } from "./facilities/facility-coverage";
import type { MarketOrder, MarketQuote, MarketTrade } from "../../schemas/src";

type AdvanceTickOptions = {
  seed?: string;
  action_queue?: ReadonlyArray<PendingAction>;
  processed_receipts?: Readonly<Record<string, ProcessedTickReceipt>>;
};

const rebuildIndexes = (world_state: WorldState): WorldState => {
  const next = cloneState(world_state);
  const agent_ids = Object.keys(next.registries.agents).sort();
  const sector_ids = Object.keys(next.registries.sectors).sort();
  const facility_ids = Object.keys(next.registries.facilities).sort();
  const contract_ids = Object.keys(next.registries.contracts).sort();
  const event_ids = Object.keys(next.registries.events).sort();
  const market_quote_ids = Object.keys(next.registries.market_quotes).sort();
  const market_order_ids = Object.keys(next.registries.market_orders).sort();
  const market_trade_ids = Object.keys(next.registries.market_trades).sort();

  next.indexes.agent_ids = agent_ids;
  next.indexes.sector_ids = sector_ids;
  next.indexes.facility_ids = facility_ids;
  next.indexes.contract_ids = contract_ids;
  next.indexes.event_ids = event_ids;
  next.indexes.market_quote_ids = market_quote_ids;
  next.indexes.market_order_ids = market_order_ids;
  next.indexes.market_trade_ids = market_trade_ids;
  next.indexes.agents_by_owner_user_id = {};
  next.indexes.agents_by_location = {};
  next.indexes.facilities_by_sector_id = {};
  next.indexes.contracts_by_agent_id = {};
  next.indexes.events_by_tick = {};
  next.indexes.market_quotes_by_sector_id = {};
  next.indexes.market_orders_by_sector_id = {};
  next.indexes.market_trades_by_tick = {};
  next.indexes.neighbor_sector_ids = buildNeighborSectorIndex(next.registries.sectors);
  next.indexes.facility_coverage_by_sector_id = buildFacilityCoverageIndex(next);

  for (const agent of Object.values(next.registries.agents)) {
    if (agent.owner_user_id) {
      next.indexes.agents_by_owner_user_id[agent.owner_user_id] = [
        ...(next.indexes.agents_by_owner_user_id[agent.owner_user_id] ?? []),
        agent.id
      ];
    }
    next.indexes.agents_by_location[agent.location] = [
      ...(next.indexes.agents_by_location[agent.location] ?? []),
      agent.id
    ];
  }

  for (const facility of Object.values(next.registries.facilities)) {
    next.indexes.facilities_by_sector_id[facility.sector_id] = [
      ...(next.indexes.facilities_by_sector_id[facility.sector_id] ?? []),
      facility.id
    ];
  }

  for (const contract of Object.values(next.registries.contracts)) {
    if (contract.agent_id) {
      next.indexes.contracts_by_agent_id[contract.agent_id] = [
        ...(next.indexes.contracts_by_agent_id[contract.agent_id] ?? []),
        contract.id
      ];
    }
  }

  for (const event of Object.values(next.registries.events)) {
    const tick_key = String(event.tick);
    next.indexes.events_by_tick[tick_key] = [...(next.indexes.events_by_tick[tick_key] ?? []), event.id];
  }

  for (const quote of Object.values(next.registries.market_quotes) as MarketQuote[]) {
    next.indexes.market_quotes_by_sector_id[quote.sector_id] = [
      ...(next.indexes.market_quotes_by_sector_id[quote.sector_id] ?? []),
      quote.id
    ];
  }

  for (const order of Object.values(next.registries.market_orders) as MarketOrder[]) {
    next.indexes.market_orders_by_sector_id[order.sector_id] = [
      ...(next.indexes.market_orders_by_sector_id[order.sector_id] ?? []),
      order.id
    ];
  }

  for (const trade of Object.values(next.registries.market_trades) as MarketTrade[]) {
    const tick_key = String(trade.executed_at_tick);
    next.indexes.market_trades_by_tick[tick_key] = [...(next.indexes.market_trades_by_tick[tick_key] ?? []), trade.id];
  }

  return synchronizeSectorOccupants(next);
};

const createSkippedResult = (
  world_state: WorldState,
  seed: string,
  issues: TickEngineResult["issues"],
  action_queue: ReadonlyArray<PendingAction>,
  processed_receipts: Readonly<Record<string, ProcessedTickReceipt>>
): TickEngineResult => {
  const tick_number = world_state.meta.current_tick + 1;
  const idempotency_key = createIdempotencyKey(world_state.meta.id, tick_number);
  const input_checksum = createWorldChecksum(world_state);
  const action_queue_checksum = createActionQueueChecksum(action_queue);
  const existing_receipt = processed_receipts[idempotency_key];
  const receipt_base = {
    receipt_id: existing_receipt?.receipt_id ?? `receipt_${tick_number}`,
    world_id: world_state.meta.id,
    tick_number,
    seed,
    idempotency_key,
    phase_order: tick_phase_order,
    input_checksum,
    output_checksum: input_checksum,
    action_queue_checksum
  };
  const receipt: ProcessedTickReceipt = {
    ...receipt_base,
    receipt_checksum: createReceiptChecksum(receipt_base)
  };

  return {
    applied: false,
    world_id: world_state.meta.id,
    tick_number,
    seed,
    idempotency_key,
    input_checksum,
    output_checksum: input_checksum,
    checksum: input_checksum,
    phase_trace: [],
    phase_outcomes: [],
    receipt,
    issues,
    event_count: 0,
    ledger_count: 0,
    resolved_actions: [],
    state_diff: [],
    next_state: cloneState(world_state)
  };
};

export const advanceWorldTick = (
  input_world_state: WorldState,
  options: AdvanceTickOptions = {}
): TickEngineResult => {
  const normalized_input_state = rebuildIndexes(synchronizeLedgerState(cloneState(input_world_state)));
  const parsed = world_state_schema.parse(normalized_input_state);
  const context = createTickContext(parsed, options.seed, options.action_queue, options.processed_receipts);
  const duplicate_issue = guardDuplicateTick(parsed, context);
  const progression_issue = guardTickProgression(parsed, context);
  const action_issues = guardActionQueue(context);

  const preflight_issues = [duplicate_issue, progression_issue].filter((value): value is NonNullable<typeof value> => value !== null);
  if (preflight_issues.length > 0 || action_issues.length > 0) {
    return createSkippedResult(parsed, context.seed, [...preflight_issues, ...action_issues], context.action_queue, context.processed_receipts);
  }

  const input_checksum = createWorldChecksum(parsed);
  const random = createDeterministicRandom(context.seed);
  let accumulator = createInitialAccumulator(cloneState(parsed));

  accumulator = environmentReducer(accumulator, context);
  accumulator = resourceRefreshReducer(accumulator, context);
  accumulator = agentUpkeepReducer(accumulator, context);
  accumulator = actionResolutionReducer(accumulator, context, random.fork("action_resolution").int);
  accumulator = relationReducer(accumulator, context);
  accumulator = eventEmissionReducer(accumulator, context);

  const next_state = rebuildIndexes(accumulator.world_state);
  const idempotency_key = createIdempotencyKey(parsed.meta.id, context.tick_number);
  const action_queue_checksum = createActionQueueChecksum(context.action_queue);
  let synchronized_next_state = synchronizeLedgerState(next_state);
  const output_checksum = createWorldChecksum(synchronized_next_state);
  const receipt_base = {
    receipt_id: `receipt_${context.tick_number}_${output_checksum.slice(0, 8)}`,
    world_id: parsed.meta.id,
    tick_number: context.tick_number,
    seed: context.seed,
    idempotency_key,
    phase_order: tick_phase_order,
    input_checksum,
    output_checksum,
    action_queue_checksum
  };
  const receipt: ProcessedTickReceipt = {
    ...receipt_base,
    receipt_checksum: createReceiptChecksum(receipt_base)
  };

  synchronized_next_state = cloneState(synchronized_next_state);
  synchronized_next_state.meta.processed_tick_receipts = {
    ...synchronized_next_state.meta.processed_tick_receipts,
    [idempotency_key]: receipt
  };
  const validated_next_state = world_state_schema.parse(synchronized_next_state);

  return {
    applied: true,
    world_id: parsed.meta.id,
    tick_number: context.tick_number,
    seed: context.seed,
    idempotency_key,
    input_checksum,
    output_checksum,
    checksum: output_checksum,
    phase_trace: accumulator.phase_outcomes.map((phase_outcome) => phase_outcome.phase),
    phase_outcomes: accumulator.phase_outcomes,
    receipt,
    issues: accumulator.issues,
    event_count: accumulator.emitted_events.length,
    ledger_count: accumulator.created_ledger_entries.length,
    resolved_actions: accumulator.resolved_actions,
    state_diff: diffState(parsed, validated_next_state),
    next_state: validated_next_state
  };
};

export const validateTickWorldState = (input: unknown) => validateWorldState(input);
