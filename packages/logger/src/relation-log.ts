import type { SocialEventIntent } from "../../social/src/relation.types";
import type { WorldLogEntry } from "./log.types";

export const createRelationLog = (world_id: string, intent: SocialEventIntent): WorldLogEntry => ({
  log_id: `log_relation_${intent.code}_${intent.tick}_${intent.actor_id}`,
  world_id,
  tick: intent.tick,
  timestamp: new Date(intent.tick * 600_000).toISOString(),
  log_type: "relation_log",
  entity_refs: {
    agent_ids: [intent.actor_id, intent.target_id].filter((value): value is string => value !== null),
    organization_ids: intent.organization_id ? [intent.organization_id] : []
  },
  severity: "info",
  payload: {
    relation_code: intent.code,
    summary: intent.summary,
    level: intent.level
  },
  correlation_id: `${intent.code}_${intent.actor_id}_${intent.tick}`
});
