import type { WorldState } from "../../schemas/src";
import type { ResourceAuditResult } from "./audit.types";

const hasNegativeValue = (values: Record<string, number>): string[] =>
  Object.entries(values)
    .filter(([, value]) => value < 0)
    .map(([key]) => key);

export const auditResources = (world_state: WorldState): ResourceAuditResult => {
  const issues: string[] = [];

  for (const agent of Object.values(world_state.registries.agents)) {
    for (const key of hasNegativeValue(agent.inventory)) {
      issues.push(`agent ${agent.id} has negative ${key}`);
    }
  }

  for (const sector of Object.values(world_state.registries.sectors)) {
    for (const key of hasNegativeValue(sector.resource_stock)) {
      issues.push(`sector ${sector.id} has negative stock ${key}`);
    }
  }

  for (const facility of Object.values(world_state.registries.facilities)) {
    for (const key of hasNegativeValue(facility.inventory)) {
      issues.push(`facility ${facility.id} has negative ${key}`);
    }
  }

  return {
    ok: issues.length === 0,
    issues
  };
};
