import type { PlanEntitlements } from "./resource.types";

export type EntitlementOverride = {
  account_id: string;
  override_id: string;
  patch: Partial<PlanEntitlements>;
  reason_code: string;
};

export const applyEntitlementOverrides = (
  entitlements: PlanEntitlements,
  overrides: EntitlementOverride[]
): PlanEntitlements => overrides.reduce<PlanEntitlements>((current, override) => ({ ...current, ...override.patch }), entitlements);
