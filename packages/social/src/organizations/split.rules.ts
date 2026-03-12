import { split_risk_break_threshold, split_risk_warn_threshold } from "../constants";
import type { OrganizationState } from "../organization.types";
import type { SocialRelation } from "../relation.types";

export const calculateSplitRisk = (organization: OrganizationState, internal_relations: ReadonlyArray<SocialRelation>): number => {
  if (internal_relations.length === 0) {
    return 0;
  }
  const average_trust = internal_relations.reduce((sum, relation) => sum + relation.trust, 0) / internal_relations.length;
  const average_hostility = internal_relations.reduce((sum, relation) => sum + relation.hostility, 0) / internal_relations.length;
  const treasury_pressure = organization.treasury.net_24h < 0 ? 15 : 0;
  return Math.min(100, Math.max(0, Math.round(average_hostility - average_trust + treasury_pressure + organization.health.split_risk)));
};

export const shouldSplitOrganization = (organization: OrganizationState, internal_relations: ReadonlyArray<SocialRelation>): boolean =>
  calculateSplitRisk(organization, internal_relations) >= split_risk_break_threshold;

export const isSplitWarning = (organization: OrganizationState, internal_relations: ReadonlyArray<SocialRelation>): boolean =>
  calculateSplitRisk(organization, internal_relations) >= split_risk_warn_threshold;
