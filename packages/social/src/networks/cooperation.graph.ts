import type { SocialRelation } from "../relation.types";
import { calculateRelationScore } from "../relations/relation-score";

export type CooperationEdge = {
  from_agent_id: string;
  to_agent_id: string;
  weight: number;
};

export const buildCooperationGraph = (relations: ReadonlyArray<SocialRelation>): CooperationEdge[] =>
  relations
    .map((relation) => ({
      from_agent_id: relation.subject_agent_id,
      to_agent_id: relation.object_agent_id,
      weight: calculateRelationScore(relation)
    }))
    .filter((edge) => edge.weight > 0);
