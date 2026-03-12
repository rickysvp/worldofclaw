export type ReputationRecord = {
  agent_id: string;
  fame: number;
  public_repairs: number;
  defense_supports: number;
  trade_reliability: number;
  updated_at_tick: number;
};

export const createReputationRecord = (agent_id: string, tick: number): ReputationRecord => ({
  agent_id,
  fame: 0,
  public_repairs: 0,
  defense_supports: 0,
  trade_reliability: 0,
  updated_at_tick: tick
});
