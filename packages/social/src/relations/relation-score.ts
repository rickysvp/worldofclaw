import type { RelationDelta, SocialRelation } from "../relation.types";
import { bond_max, bond_min, debt_min, fame_max, fame_min, hostility_max, hostility_min, trust_max, trust_min } from "../constants";

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

export const applyRelationDelta = (relation: SocialRelation, delta: RelationDelta, tick: number): SocialRelation => ({
  ...relation,
  trust: clamp(relation.trust + delta.trust_delta, trust_min, trust_max),
  hostility: clamp(relation.hostility + delta.hostility_delta, hostility_min, hostility_max),
  bond: clamp(relation.bond + delta.bond_delta, bond_min, bond_max),
  debt: Math.max(debt_min, relation.debt + delta.debt_delta),
  fame_credit: clamp(relation.fame_credit + delta.fame_credit_delta, fame_min, fame_max),
  successful_trade_streak: Math.max(0, relation.successful_trade_streak + delta.successful_trade_streak_delta),
  successful_trade_ticks:
    delta.successful_trade_tick === undefined
      ? relation.successful_trade_ticks
      : [...relation.successful_trade_ticks, delta.successful_trade_tick].slice(-12),
  shared_facility_payment_count: relation.shared_facility_payment_count + (delta.shared_facility_payment_delta ?? 0),
  mutual_defense_count: relation.mutual_defense_count + (delta.mutual_defense_delta ?? 0),
  aid_count: relation.aid_count + (delta.aid_delta ?? 0),
  breach_count: relation.breach_count + (delta.breach_delta ?? 0),
  last_interaction_tick: tick,
  updated_at_tick: tick
});

export const calculateRelationScore = (relation: Pick<SocialRelation, "trust" | "hostility" | "bond" | "debt">): number =>
  relation.trust + relation.bond - relation.hostility - Math.min(30, relation.debt);
