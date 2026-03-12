import type { SectorAccessPolicy } from "../../../schemas/src";
import type { OrganizationState } from "../organization.types";
import { deriveProtectedZones } from "./protected-zones";

export type TerritoryOrder = {
  sector_id: string;
  organization_id: string;
  access_policy: SectorAccessPolicy;
  protected_zone: boolean;
};

export const deriveTerritoryOrder = (organizations: ReadonlyArray<OrganizationState>): TerritoryOrder[] => {
  const protected_zones = new Set(deriveProtectedZones(organizations));
  return organizations.flatMap((organization) =>
    organization.controlled_sector_ids.map((sector_id) => ({
      sector_id,
      organization_id: organization.organization_id,
      access_policy: organization.runtime.access_mode === "members_only" ? "members_only" : "restricted",
      protected_zone: protected_zones.has(sector_id)
    }))
  );
};
