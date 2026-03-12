export type RelationMetric = "trust" | "hostility" | "bond" | "debt";

export type RelationKey = string;

export type SocialRelation = {
  relation_key: RelationKey;
  subject_agent_id: string;
  object_agent_id: string;
  trust: number;
  hostility: number;
  bond: number;
  debt: number;
  fame_credit: number;
  successful_trade_streak: number;
  successful_trade_ticks: number[];
  shared_facility_payment_count: number;
  mutual_defense_count: number;
  aid_count: number;
  breach_count: number;
  last_interaction_tick: number | null;
  updated_at_tick: number;
};

export type RelationDelta = {
  trust_delta: number;
  hostility_delta: number;
  bond_delta: number;
  debt_delta: number;
  fame_credit_delta: number;
  successful_trade_streak_delta: number;
  successful_trade_tick?: number;
  shared_facility_payment_delta?: number;
  mutual_defense_delta?: number;
  aid_delta?: number;
  breach_delta?: number;
};

export type SocialEventIntent = {
  code: string;
  level: "info" | "warn";
  tick: number;
  actor_id: string;
  target_id: string | null;
  organization_id: string | null;
  summary: string;
  metadata: Record<string, string | number | boolean>;
};

export type SocialLedgerIntent = {
  entity_id: string;
  counterparty_entity_id: string | null;
  tick: number;
  credits_delta: number;
  note: string;
  payload: Record<string, string | number | boolean>;
};

export type AidInteraction = {
  helper_agent_id: string;
  helped_agent_id: string;
  tick: number;
  debt_amount: number;
};

export const createRelationKey = (subject_agent_id: string, object_agent_id: string): RelationKey =>
  `${subject_agent_id}->${object_agent_id}`;

export const createEmptyRelation = (
  subject_agent_id: string,
  object_agent_id: string,
  tick: number
): SocialRelation => ({
  relation_key: createRelationKey(subject_agent_id, object_agent_id),
  subject_agent_id,
  object_agent_id,
  trust: 0,
  hostility: 0,
  bond: 0,
  debt: 0,
  fame_credit: 0,
  successful_trade_streak: 0,
  successful_trade_ticks: [],
  shared_facility_payment_count: 0,
  mutual_defense_count: 0,
  aid_count: 0,
  breach_count: 0,
  last_interaction_tick: null,
  updated_at_tick: tick
});
