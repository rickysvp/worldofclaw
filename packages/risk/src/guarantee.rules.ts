export type GuaranteeResult = {
  service_level: "standard" | "degraded" | "suspended";
  reason_codes: string[];
};

export const evaluateGuarantee = (input: { suspended: boolean; downgraded: boolean }): GuaranteeResult => {
  if (input.suspended) {
    return { service_level: "suspended", reason_codes: ["ACCOUNT_SUSPENDED"] };
  }
  if (input.downgraded) {
    return { service_level: "degraded", reason_codes: ["FEATURE_DOWNGRADED"] };
  }
  return { service_level: "standard", reason_codes: [] };
};
