import { mutual_defense_bond_gain, shared_facility_bond_gain } from "../constants";
import type { RelationDelta } from "../relation.types";

export const getSharedFacilityBondDelta = (): RelationDelta => ({
  trust_delta: 0,
  hostility_delta: 0,
  bond_delta: shared_facility_bond_gain,
  debt_delta: 0,
  fame_credit_delta: 0,
  successful_trade_streak_delta: 0,
  shared_facility_payment_delta: 1
});

export const getMutualDefenseBondDelta = (): RelationDelta => ({
  trust_delta: 0,
  hostility_delta: 0,
  bond_delta: mutual_defense_bond_gain,
  debt_delta: 0,
  fame_credit_delta: 0,
  successful_trade_streak_delta: 0,
  mutual_defense_delta: 1
});
