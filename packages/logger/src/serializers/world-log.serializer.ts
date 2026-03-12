import type { WorldLogEntry } from "../log.types";

export const serializeWorldLog = (entry: WorldLogEntry): string => JSON.stringify(entry);
