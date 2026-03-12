import { default_retention_by_type } from "../constants";
import type { WorldLogEntry } from "../log.types";

export const shouldRetainLog = (entry: WorldLogEntry, current_tick: number): boolean =>
  current_tick - entry.tick <= default_retention_by_type[entry.log_type];

export const applyRetentionRules = (entries: ReadonlyArray<WorldLogEntry>, current_tick: number): WorldLogEntry[] =>
  entries.filter((entry) => shouldRetainLog(entry, current_tick));
