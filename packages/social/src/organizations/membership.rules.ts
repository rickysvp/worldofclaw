import type { OrganizationMember, OrganizationRole } from "../organization.types";

export const deriveMemberRole = (input: {
  agent_id: string;
  founder_agent_id: string;
  trade_count: number;
  maintenance_count: number;
}): OrganizationRole => {
  if (input.agent_id === input.founder_agent_id) {
    return "founder";
  }
  if (input.maintenance_count > 0) {
    return "maintainer";
  }
  if (input.trade_count > 0) {
    return "trader";
  }
  return "member";
};

export const buildOrganizationMembers = (input: {
  member_agent_ids: string[];
  founder_agent_id: string;
  joined_at_tick: number;
  trade_counts?: Record<string, number>;
  maintenance_counts?: Record<string, number>;
}): OrganizationMember[] =>
  input.member_agent_ids.map((agent_id) => ({
    agent_id,
    role: deriveMemberRole({
      agent_id,
      founder_agent_id: input.founder_agent_id,
      trade_count: input.trade_counts?.[agent_id] ?? 0,
      maintenance_count: input.maintenance_counts?.[agent_id] ?? 0
    }),
    joined_at_tick: input.joined_at_tick,
    trade_count: input.trade_counts?.[agent_id] ?? 0,
    maintenance_count: input.maintenance_counts?.[agent_id] ?? 0,
    defense_count: 0
  }));

export const hasMemberRole = (members: ReadonlyArray<OrganizationMember>, role: OrganizationRole): boolean =>
  members.some((member) => member.role === role);
