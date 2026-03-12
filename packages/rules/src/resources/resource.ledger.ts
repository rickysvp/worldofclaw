import type { LedgerEntry, ResourceType } from "../../../schemas/src";

export const createResourceLedgerEntryInput = (input: {
  tick: number;
  entity_id: string;
  resource_type: ResourceType | null;
  amount_delta: number;
  credits_delta?: number;
  action_ref: string | null;
  note: string;
  counterparty_entity_id?: string | null;
  payload?: Record<string, string | number | boolean>;
}): Omit<LedgerEntry, "id"> => ({
  tick: input.tick,
  kind: input.resource_type ? "resource_delta" : "credits_delta",
  resource_type: input.resource_type,
  amount_delta: input.amount_delta,
  credits_delta: input.credits_delta ?? 0,
  entity_id: input.entity_id,
  counterparty_entity_id: input.counterparty_entity_id ?? null,
  action_ref: input.action_ref,
  note: input.note,
  payload: input.payload ?? {}
});
