import { dissolve_health_threshold, faction_min_members, outpost_min_active_agents } from "../constants";
import type { OrganizationState } from "../organization.types";

export const shouldDissolveOrganization = (organization: OrganizationState): boolean => {
  const min_members = organization.organization_type === "faction" ? faction_min_members : organization.organization_type === "outpost" ? outpost_min_active_agents : 2;
  return organization.members.length < min_members || organization.health.stability < dissolve_health_threshold || organization.health.dissolve_risk >= 90;
};
