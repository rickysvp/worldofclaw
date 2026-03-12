import type { WorldState } from "../../../schemas/src";
import type { OnboardingHealthReport } from "../audit.types";

export const buildOnboardingHealthReport = (world_state: WorldState): OnboardingHealthReport => {
  const agents = Object.values(world_state.registries.agents);
  const protected_agents = agents.filter((agent) => {
    const safe_until_tick = Number(agent.runtime_flags.safe_until_tick ?? -1);
    return safe_until_tick >= world_state.meta.current_tick;
  });
  const failing_newbies = protected_agents.filter((agent) => agent.power <= 2 || agent.durability <= 5);

  return {
    protected_agents: protected_agents.length,
    failing_newbies: failing_newbies.length
  };
};
