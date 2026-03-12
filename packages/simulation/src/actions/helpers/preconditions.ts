import type { Agent, PendingAction } from "../../../../schemas/src";
import type { TickAccumulator } from "../../tick-context";

export const getActionAgent = (accumulator: TickAccumulator, action: PendingAction): Agent | null => {
  const agent = accumulator.world_state.registries.agents[action.agent_id];
  if (!agent || agent.status === "wrecked") {
    return null;
  }
  return agent;
};
