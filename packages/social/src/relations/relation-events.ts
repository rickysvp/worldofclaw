import type { SocialEventIntent, SocialLedgerIntent } from "../relation.types";

export const createRelationEvent = (input: {
  code: string;
  tick: number;
  actor_id: string;
  target_id: string | null;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
  level?: "info" | "warn";
}): SocialEventIntent => ({
  code: input.code,
  tick: input.tick,
  actor_id: input.actor_id,
  target_id: input.target_id,
  organization_id: null,
  level: input.level ?? "info",
  summary: input.summary,
  metadata: input.metadata ?? {}
});

export const createOrganizationEvent = (input: {
  code: string;
  tick: number;
  organization_id: string;
  actor_id: string;
  summary: string;
  metadata?: Record<string, string | number | boolean>;
  level?: "info" | "warn";
}): SocialEventIntent => ({
  code: input.code,
  tick: input.tick,
  actor_id: input.actor_id,
  target_id: null,
  organization_id: input.organization_id,
  level: input.level ?? "info",
  summary: input.summary,
  metadata: input.metadata ?? {}
});

export const createSocialLedgerEntry = (input: {
  entity_id: string;
  counterparty_entity_id?: string | null;
  tick: number;
  credits_delta: number;
  note: string;
  payload?: Record<string, string | number | boolean>;
}): SocialLedgerIntent => ({
  entity_id: input.entity_id,
  counterparty_entity_id: input.counterparty_entity_id ?? null,
  tick: input.tick,
  credits_delta: input.credits_delta,
  note: input.note,
  payload: input.payload ?? {}
});
