import type { WorldLogEntry } from "../log.types";

export const queryLogsByFacility = (entries: ReadonlyArray<WorldLogEntry>, facility_id: string): WorldLogEntry[] =>
  entries.filter((entry) => entry.entity_refs.facility_ids?.includes(facility_id) ?? false);
