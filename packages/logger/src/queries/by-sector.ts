import type { WorldLogEntry } from "../log.types";

export const queryLogsBySector = (entries: ReadonlyArray<WorldLogEntry>, sector_id: string): WorldLogEntry[] =>
  entries.filter((entry) => entry.entity_refs.sector_ids?.includes(sector_id) ?? false);
