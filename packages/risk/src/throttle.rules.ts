import type { QuotaEvaluation } from "./quota.rules";
import type { RateLimitEvaluation } from "./rate-limit.rules";

export type ThrottleDecision = {
  action: "allow" | "warning" | "temporary_throttle";
  reason_codes: string[];
};

export const evaluateThrottle = (input: { rate: RateLimitEvaluation; quota: QuotaEvaluation }): ThrottleDecision => {
  if (!input.rate.allowed || !input.quota.allowed) {
    return { action: "temporary_throttle", reason_codes: [input.rate.reason_code, input.quota.reason_code].filter((value): value is string => value !== null) };
  }
  if (input.rate.action === "warning") {
    return { action: "warning", reason_codes: input.rate.reason_code ? [input.rate.reason_code] : [] };
  }
  return { action: "allow", reason_codes: [] };
};
