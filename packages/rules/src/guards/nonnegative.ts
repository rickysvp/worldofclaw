export const clampNonNegative = (value: number): number => Math.max(0, Math.trunc(value));

export const isNonNegativeInteger = (value: number): boolean => Number.isInteger(value) && value >= 0;
