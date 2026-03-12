import type { StateDiffEntry } from "../../../simulation/src/utils/diff-state";

export const serializeDiff = (entries: ReadonlyArray<StateDiffEntry>): string =>
  JSON.stringify(entries.map((entry) => ({ path: entry.path, before: entry.before, after: entry.after })));
