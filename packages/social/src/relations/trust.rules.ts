import { contract_breach_trust_penalty, successful_trade_streak_bonus, successful_trade_streak_threshold, successful_trade_trust_gain } from "../constants";
import type { RelationDelta, SocialRelation } from "../relation.types";

export const getSuccessfulTradeTrustDelta = (relation: Pick<SocialRelation, "successful_trade_streak">, tick: number): RelationDelta => {
  const next_streak = relation.successful_trade_streak + 1;
  return {
    trust_delta: successful_trade_trust_gain + (next_streak >= successful_trade_streak_threshold ? successful_trade_streak_bonus : 0),
    hostility_delta: 0,
    bond_delta: 0,
    debt_delta: 0,
    fame_credit_delta: 0,
    successful_trade_streak_delta: 1,
    successful_trade_tick: tick
  };
};

export const getContractBreachTrustDelta = (): RelationDelta => ({
  trust_delta: -contract_breach_trust_penalty,
  hostility_delta: 0,
  bond_delta: 0,
  debt_delta: 0,
  fame_credit_delta: 0,
  successful_trade_streak_delta: -99,
  breach_delta: 1
});
