import type { Agent } from "../../../schemas/src";

export type CohabitationCluster = {
  location_id: string;
  member_agent_ids: string[];
};

export const deriveCohabitationClusters = (agents: ReadonlyArray<Pick<Agent, "id" | "location" | "shelter_level">>): CohabitationCluster[] => {
  const clusters = new Map<string, string[]>();

  for (const agent of agents) {
    if (agent.shelter_level <= 0) {
      continue;
    }
    clusters.set(agent.location, [...(clusters.get(agent.location) ?? []), agent.id]);
  }

  return [...clusters.entries()].map(([location_id, member_agent_ids]) => ({
    location_id,
    member_agent_ids
  }));
};
