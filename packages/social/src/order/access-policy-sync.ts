import type { FacilityAccessPolicy, SectorAccessPolicy } from "../../../schemas/src";
import type { OrganizationState } from "../organization.types";

export type AccessPolicySync = {
  sector_access_policy: SectorAccessPolicy;
  facility_access_policy: FacilityAccessPolicy;
};

export const syncAccessPolicyFromOrganization = (organization: OrganizationState): AccessPolicySync => ({
  sector_access_policy: organization.runtime.access_mode === "members_only" ? "members_only" : organization.organization_type === "supply_network" ? "open" : "restricted",
  facility_access_policy: organization.runtime.access_mode === "members_only" ? "members_only" : organization.organization_type === "supply_network" ? "public" : "restricted"
});
