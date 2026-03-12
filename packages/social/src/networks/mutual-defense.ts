import type { SocialRelation } from "../relation.types";

export type MutualDefenseCluster = {
  member_agent_ids: string[];
  defense_links: number;
};

export const deriveMutualDefenseClusters = (relations: ReadonlyArray<SocialRelation>): MutualDefenseCluster[] =>
  relations
    .filter((relation) => relation.mutual_defense_count >= 2)
    .map((relation) => ({
      member_agent_ids: [relation.subject_agent_id, relation.object_agent_id],
      defense_links: relation.mutual_defense_count
    }));
