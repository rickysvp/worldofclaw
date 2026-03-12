import type { OrganizationState } from "../../../social/src/organization.types";
import type { OrganizationHealthReport } from "../audit.types";

export const buildOrganizationHealthReport = (organizations: ReadonlyArray<OrganizationState>): OrganizationHealthReport => ({
  organization_count: organizations.length,
  unstable_organization_ids: organizations
    .filter((organization) => organization.health.split_risk >= 50 || organization.health.dissolve_risk >= 50)
    .map((organization) => organization.organization_id)
});
