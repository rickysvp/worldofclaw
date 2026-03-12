import type { WorldLogEntry } from "../log.types";

export const queryLogsByOrganization = (entries: ReadonlyArray<WorldLogEntry>, organization_id: string): WorldLogEntry[] =>
  entries.filter((entry) => entry.entity_refs.organization_ids?.includes(organization_id) ?? false);
