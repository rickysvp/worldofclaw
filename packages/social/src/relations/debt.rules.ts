import { aided_stopped_agent_trust_gain } from "../constants";
import type { AidInteraction, RelationDelta } from "../relation.types";

export const getAidDebtDelta = (interaction: AidInteraction): RelationDelta => ({
  trust_delta: aided_stopped_agent_trust_gain,
  hostility_delta: 0,
  bond_delta: 0,
  debt_delta: interaction.debt_amount,
  fame_credit_delta: 0,
  successful_trade_streak_delta: 0,
  aid_delta: 1
});

export const settleDebt = (current_debt: number, credits_paid: number): number => Math.max(0, current_debt - credits_paid);
