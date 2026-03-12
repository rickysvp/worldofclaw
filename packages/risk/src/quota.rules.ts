export type QuotaEvaluation = {
  allowed: boolean;
  exceeded: boolean;
  usage: number;
  quota: number;
  reason_code: string | null;
};

export const evaluateQuota = (usage: number, quota: number, reason_code: string): QuotaEvaluation => ({
  allowed: usage <= quota,
  exceeded: usage > quota,
  usage,
  quota,
  reason_code: usage > quota ? reason_code : null
});
