import type {
  LedgerEntry,
  PendingAction as PendingActionInput,
  ResolvedActionRecord,
  WorldEvent,
  WorldState
} from "../../schemas/src";
import { world_constants } from "../../schemas/src";
import type { StateDiffEntry } from "./utils/diff-state";
import type { TickPhaseName } from "./tick-phases";

export type PendingAction = PendingActionInput;

export type ProcessedTickReceipt = {
  receipt_id: string;
  world_id: string;
  tick_number: number;
  seed: string;
  idempotency_key: string;
  phase_order: readonly TickPhaseName[];
  input_checksum: string;
  output_checksum: string;
  action_queue_checksum: string;
  receipt_checksum: string;
};

export type TickEngineOptions = {
  idle_power_cost: number;
  night_power_penalty_without_shelter: number;
  low_durability_threshold: number;
  low_durability_power_penalty: number;
  stopped_durability_threshold_ticks: number;
  wrecked_threshold_ticks: number;
  stopped_durability_damage: number;
  generator_power_output: number;
  charge_transfer_cap: number;
  repair_scrap_cost: number;
  repair_durability_gain: number;
};

export type EnvironmentSnapshot = {
  is_day: boolean;
  daylight_cycle_tick: number;
  ambient_power_modifier: number;
  maintenance_pressure: number;
};

export type PhaseOutcome = {
  phase: TickPhaseName;
  applied: boolean;
  summary: string;
  event_ids: string[];
  ledger_ids: string[];
  metadata: Record<string, string | number | boolean | null>;
};

export type ResolvedAction = ResolvedActionRecord;

export type TickEngineIssue = {
  code: string;
  message: string;
};

export type TickAccumulator = {
  world_state: WorldState;
  phase_outcomes: PhaseOutcome[];
  emitted_events: WorldEvent[];
  created_ledger_entries: LedgerEntry[];
  resolved_actions: ResolvedAction[];
  processed_action_ids: string[];
  environment: EnvironmentSnapshot;
  event_counter: number;
  ledger_counter: number;
  issues: TickEngineIssue[];
};

export type TickContext = {
  world_id: string;
  tick_number: number;
  seed: string;
  action_queue: ReadonlyArray<PendingAction>;
  processed_receipts: Readonly<Record<string, ProcessedTickReceipt>>;
  options: TickEngineOptions;
};

export type TickEngineResult = {
  applied: boolean;
  world_id: string;
  tick_number: number;
  seed: string;
  idempotency_key: string;
  input_checksum: string;
  output_checksum: string;
  checksum: string;
  phase_trace: TickPhaseName[];
  phase_outcomes: PhaseOutcome[];
  receipt: ProcessedTickReceipt;
  issues: TickEngineIssue[];
  event_count: number;
  ledger_count: number;
  resolved_actions: ResolvedAction[];
  state_diff: StateDiffEntry[];
  next_state: WorldState;
};

export const default_tick_engine_options: TickEngineOptions = {
  idle_power_cost: 1,
  night_power_penalty_without_shelter: 1,
  low_durability_threshold: 50,
  low_durability_power_penalty: 1,
  stopped_durability_threshold_ticks: 3,
  wrecked_threshold_ticks: 12,
  stopped_durability_damage: 10,
  generator_power_output: 2,
  charge_transfer_cap: 10,
  repair_scrap_cost: 1,
  repair_durability_gain: 10
};

export const createTickContext = (
  world_state: WorldState,
  seed = world_state.meta.seed,
  action_queue: ReadonlyArray<PendingAction> = [],
  processed_receipts: Readonly<Record<string, ProcessedTickReceipt>> = {},
  options: Partial<TickEngineOptions> = {}
): TickContext => ({
  world_id: world_state.meta.id,
  tick_number: world_state.meta.current_tick + 1,
  seed,
  action_queue,
  processed_receipts: {
    ...world_state.meta.processed_tick_receipts,
    ...processed_receipts
  },
  options: {
    ...default_tick_engine_options,
    ...options
  }
});

export const createInitialAccumulator = (world_state: WorldState): TickAccumulator => ({
  world_state,
  phase_outcomes: [],
  emitted_events: [],
  created_ledger_entries: [],
  resolved_actions: [],
  processed_action_ids: [],
  environment: {
    is_day: true,
    daylight_cycle_tick: 0,
    ambient_power_modifier: 0,
    maintenance_pressure: 0
  },
  event_counter: 0,
  ledger_counter: 0,
  issues: []
});

export const tickDurationSeconds = world_constants.tick_duration_seconds;
