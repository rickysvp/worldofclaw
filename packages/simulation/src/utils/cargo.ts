import type { Agent } from "../../../schemas/src";

export const getRemainingCargoCapacity = (agent: Agent): number =>
  Math.max(0, agent.cargo_max - agent.cargo_used);

export const increaseCargoUsed = (agent: Agent, amount: number): number => {
  const applied_amount = Math.max(0, amount);
  agent.cargo_used = Math.min(agent.cargo_max, agent.cargo_used + applied_amount);
  return agent.cargo_used;
};

export const decreaseCargoUsed = (agent: Agent, amount: number): number => {
  const applied_amount = Math.max(0, amount);
  agent.cargo_used = Math.max(0, agent.cargo_used - applied_amount);
  return agent.cargo_used;
};
