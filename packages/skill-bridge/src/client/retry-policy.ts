export type RetryPolicy = {
  max_attempts: number;
  base_delay_ms: number;
  retry_on_statuses: number[];
};

export const default_retry_policy: RetryPolicy = {
  max_attempts: 3,
  base_delay_ms: 250,
  retry_on_statuses: [429, 500, 502, 503, 504]
};

export const shouldRetry = (status: number, attempt: number, policy: RetryPolicy = default_retry_policy): boolean =>
  attempt < policy.max_attempts && policy.retry_on_statuses.includes(status);

export const getRetryDelayMs = (attempt: number, policy: RetryPolicy = default_retry_policy): number =>
  policy.base_delay_ms * 2 ** Math.max(0, attempt - 1);
