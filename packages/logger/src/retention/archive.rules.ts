import { archive_after_ticks } from "../constants";
import type { WorldLogEntry } from "../log.types";

export const shouldArchiveLog = (entry: WorldLogEntry, current_tick: number): boolean => current_tick - entry.tick > archive_after_ticks;

export const partitionArchivedLogs = (entries: ReadonlyArray<WorldLogEntry>, current_tick: number): {
  archived: WorldLogEntry[];
  active: WorldLogEntry[];
} => ({
  archived: entries.filter((entry) => shouldArchiveLog(entry, current_tick)),
  active: entries.filter((entry) => !shouldArchiveLog(entry, current_tick))
});
