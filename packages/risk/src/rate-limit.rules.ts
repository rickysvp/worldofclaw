export type RateLimitEvaluation = {
  allowed: boolean;
  remaining: number;
  action: "warning" | "temporary_throttle" | null;
  reason_code: string | null;
};

export const evaluateRateLimit = (limit: number, used: number): RateLimitEvaluation => {
  if (used > limit) {
    return { allowed: false, remaining: 0, action: "temporary_throttle", reason_code: "RATE_LIMIT_EXCEEDED" };
  }
  if (used >= Math.floor(limit * 0.9)) {
    return { allowed: true, remaining: Math.max(0, limit - used), action: "warning", reason_code: "RATE_LIMIT_NEAR_CAP" };
  }
  return { allowed: true, remaining: Math.max(0, limit - used), action: null, reason_code: null };
};
