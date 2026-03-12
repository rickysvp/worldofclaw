import type { OrganizationRole } from "../organization.types";

export type OrganizationPermission = "invite" | "set_policy" | "spend_treasury" | "use_services" | "trade";

const permission_map: Record<OrganizationRole, OrganizationPermission[]> = {
  founder: ["invite", "set_policy", "spend_treasury", "use_services", "trade"],
  maintainer: ["spend_treasury", "use_services", "trade"],
  trader: ["trade", "use_services"],
  member: ["trade", "use_services"],
  guest: ["use_services"]
};

export const hasOrganizationPermission = (role: OrganizationRole, permission: OrganizationPermission): boolean =>
  permission_map[role].includes(permission);
