import type { platform_permissions } from "./constants";

export type PlatformPermission = (typeof platform_permissions)[number];

export type PolicyDecision = {
  allowed: boolean;
  permission: PlatformPermission;
  reason_codes: string[];
  matched_roles: string[];
};
