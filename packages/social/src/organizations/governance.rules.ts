import { default_service_fee_bps, default_tax_rate_bps, default_treasury_split_bps } from "../constants";
import type { OrganizationGovernance, OrganizationState, OrganizationType } from "../organization.types";

export const deriveGovernance = (organization_type: OrganizationType): OrganizationGovernance => ({
  tax_rate_bps: organization_type === "supply_network" ? 0 : default_tax_rate_bps,
  service_fee_bps: organization_type === "faction" ? default_service_fee_bps + 200 : default_service_fee_bps,
  treasury_split_bps: default_treasury_split_bps
});

export const hasAccessDifference = (organization: Pick<OrganizationState, "runtime" | "governance">): boolean =>
  organization.runtime.access_mode === "members_only" || organization.governance.tax_rate_bps > 0;
