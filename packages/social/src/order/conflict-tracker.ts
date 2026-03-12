import type { SocialRelation } from "../relation.types";

export type ConflictSummary = {
  organization_id: string;
  hostile_links: number;
  average_hostility: number;
};

export const deriveConflictSummary = (organization_id: string, relations: ReadonlyArray<SocialRelation>): ConflictSummary => ({
  organization_id,
  hostile_links: relations.filter((relation) => relation.hostility >= 20).length,
  average_hostility: relations.length === 0 ? 0 : relations.reduce((sum, relation) => sum + relation.hostility, 0) / relations.length
});
