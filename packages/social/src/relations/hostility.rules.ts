import { attack_critical_hostility_gain, attack_hostility_gain, contract_breach_hostility_gain } from "../constants";
import type { RelationDelta } from "../relation.types";

export const getAttackHostilityDelta = (critical: boolean): RelationDelta => ({
  trust_delta: 0,
  hostility_delta: critical ? attack_critical_hostility_gain : attack_hostility_gain,
  bond_delta: 0,
  debt_delta: 0,
  fame_credit_delta: 0,
  successful_trade_streak_delta: -99
});

export const getBreachHostilityDelta = (): RelationDelta => ({
  trust_delta: 0,
  hostility_delta: contract_breach_hostility_gain,
  bond_delta: 0,
  debt_delta: 0,
  fame_credit_delta: 0,
  successful_trade_streak_delta: -99,
  breach_delta: 1
});
