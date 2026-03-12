export type DeterministicRandom = {
  readonly seed: string;
  next: () => number;
  int: (min: number, max: number) => number;
  fork: (label: string) => DeterministicRandom;
};

const hash_seed = (input: string): number => {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
};

const mulberry32 = (seed_value: number) => {
  let state = seed_value >>> 0;
  return () => {
    state += 0x6d2b79f5;
    let result = Math.imul(state ^ (state >>> 15), 1 | state);
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result);
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296;
  };
};

export const createDeterministicRandom = (seed: string): DeterministicRandom => {
  const next_value = mulberry32(hash_seed(seed));

  return {
    seed,
    next: () => next_value(),
    int: (min: number, max: number) => {
      const bounded_min = Math.ceil(Math.min(min, max));
      const bounded_max = Math.floor(Math.max(min, max));
      const span = bounded_max - bounded_min + 1;
      return bounded_min + Math.floor(next_value() * span);
    },
    fork: (label: string) => createDeterministicRandom(`${seed}:${label}`)
  };
};
