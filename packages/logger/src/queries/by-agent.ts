import type { WorldLogEntry } from "../log.types";

export const queryLogsByAgent = (entries: ReadonlyArray<WorldLogEntry>, agent_id: string): WorldLogEntry[] =>
  entries.filter((entry) => entry.entity_refs.agent_ids?.includes(agent_id) ?? false);
