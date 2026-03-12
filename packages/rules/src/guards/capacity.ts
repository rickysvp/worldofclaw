export const clampToCapacity = (value: number, capacity: number): number => Math.min(Math.max(0, Math.trunc(value)), Math.max(0, Math.trunc(capacity)));

export const hasCapacityFor = (current: number, delta: number, capacity: number): boolean => current + delta <= capacity;
