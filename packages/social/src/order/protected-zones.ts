import type { OrganizationState } from "../organization.types";

export const deriveProtectedZones = (organizations: ReadonlyArray<OrganizationState>): string[] =>
  [...new Set(
    organizations
      .filter((organization) => organization.organization_type === "outpost" || organization.organization_type === "faction")
      .flatMap((organization) => organization.controlled_sector_ids)
  )];
