import { supply_network_mutual_defense_threshold, supply_network_shared_facility_threshold, supply_network_trade_threshold, supply_network_window_ticks } from "../constants";
import type { SocialRelation } from "../relation.types";

export type SupplyNetworkCandidate = {
  member_agent_ids: string[];
  average_trust: number;
  average_bond: number;
  trade_links: number;
  shared_facility_links: number;
  defense_links: number;
};

const withinWindow = (ticks: readonly number[], current_tick: number): number =>
  ticks.filter((tick) => current_tick - tick < supply_network_window_ticks).length;

export const qualifiesForSupplyNetwork = (relation: SocialRelation, current_tick: number): boolean =>
  withinWindow(relation.successful_trade_ticks, current_tick) >= supply_network_trade_threshold ||
  relation.shared_facility_payment_count >= supply_network_shared_facility_threshold ||
  relation.mutual_defense_count >= supply_network_mutual_defense_threshold;

export const deriveSupplyNetworkCandidates = (
  relations: ReadonlyArray<SocialRelation>,
  current_tick: number
): SupplyNetworkCandidate[] => {
  const qualifying_relations = relations.filter((relation) => qualifiesForSupplyNetwork(relation, current_tick));
  const adjacency = new Map<string, Set<string>>();
  const relation_keys = new Map<string, SocialRelation[]>();

  for (const relation of qualifying_relations) {
    adjacency.set(relation.subject_agent_id, new Set([...(adjacency.get(relation.subject_agent_id) ?? []), relation.object_agent_id]));
    adjacency.set(relation.object_agent_id, new Set([...(adjacency.get(relation.object_agent_id) ?? []), relation.subject_agent_id]));
    const key = [relation.subject_agent_id, relation.object_agent_id].sort().join("|");
    relation_keys.set(key, [...(relation_keys.get(key) ?? []), relation]);
  }

  const visited = new Set<string>();
  const candidates: SupplyNetworkCandidate[] = [];

  for (const agent_id of adjacency.keys()) {
    if (visited.has(agent_id)) {
      continue;
    }

    const stack = [agent_id];
    const component = new Set<string>();
    while (stack.length > 0) {
      const current_agent_id = stack.pop()!;
      if (visited.has(current_agent_id)) {
        continue;
      }
      visited.add(current_agent_id);
      component.add(current_agent_id);
      for (const neighbor_id of adjacency.get(current_agent_id) ?? []) {
        if (!visited.has(neighbor_id)) {
          stack.push(neighbor_id);
        }
      }
    }

    const component_relations = qualifying_relations.filter(
      (relation) => component.has(relation.subject_agent_id) && component.has(relation.object_agent_id)
    );

    candidates.push({
      member_agent_ids: [...component].sort(),
      average_trust: Math.round(component_relations.reduce((sum, relation) => sum + relation.trust, 0) / component_relations.length),
      average_bond: Math.round(component_relations.reduce((sum, relation) => sum + relation.bond, 0) / component_relations.length),
      trade_links: component_relations.reduce((sum, relation) => sum + withinWindow(relation.successful_trade_ticks, current_tick), 0),
      shared_facility_links: component_relations.reduce((sum, relation) => sum + relation.shared_facility_payment_count, 0),
      defense_links: component_relations.reduce((sum, relation) => sum + relation.mutual_defense_count, 0)
    });
  }

  return candidates;
};
