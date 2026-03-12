export type SuspensionDecision = {
  action: "none" | "feature_downgrade" | "suspend" | "ban";
  reason_codes: string[];
};

export const evaluateSuspension = (input: { dispute_count: number; severe_breach_count: number; repeated_overage_count: number }): SuspensionDecision => {
  if (input.severe_breach_count >= 3) {
    return { action: "ban", reason_codes: ["SEVERE_BREACH_BAN"] };
  }
  if (input.dispute_count >= 2 || input.repeated_overage_count >= 5) {
    return { action: "suspend", reason_codes: ["ACCOUNT_SUSPENDED_FOR_RISK"] };
  }
  if (input.repeated_overage_count >= 2) {
    return { action: "feature_downgrade", reason_codes: ["FEATURE_DOWNGRADE_FOR_RISK"] };
  }
  return { action: "none", reason_codes: [] };
};
