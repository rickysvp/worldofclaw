export type StateDiffEntry = {
  path: string;
  before: string;
  after: string;
};

const is_object = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const normalize = (value: unknown): string => JSON.stringify(value);

export const diffState = (before: unknown, after: unknown, base_path = "$"): StateDiffEntry[] => {
  if (normalize(before) === normalize(after)) {
    return [];
  }

  if (Array.isArray(before) && Array.isArray(after)) {
    const max_length = Math.max(before.length, after.length);
    const entries: StateDiffEntry[] = [];
    for (let index = 0; index < max_length; index += 1) {
      entries.push(...diffState(before[index], after[index], `${base_path}[${index}]`));
    }
    return entries;
  }

  if (is_object(before) && is_object(after)) {
    const keys = Array.from(new Set([...Object.keys(before), ...Object.keys(after)])).sort();
    const entries: StateDiffEntry[] = [];
    for (const key of keys) {
      entries.push(...diffState(before[key], after[key], `${base_path}.${key}`));
    }
    return entries;
  }

  return [
    {
      path: base_path,
      before: normalize(before),
      after: normalize(after)
    }
  ];
};
