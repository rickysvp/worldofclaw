import type { WorldLogEntry } from "../log.types";

export const queryLogsBySession = (entries: ReadonlyArray<WorldLogEntry>, session_id: string): WorldLogEntry[] =>
  entries.filter((entry) => entry.entity_refs.session_ids?.includes(session_id) ?? false);
