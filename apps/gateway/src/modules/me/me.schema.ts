import { z } from "zod";

export const meViewerQuerySchema = z.object({
  user_ref: z.string().min(1).max(255)
});

export const clawSummarySchema = z.object({
  user_ref: z.string().min(1),
  runtime_id: z.string().uuid(),
  claw_name: z.string().min(1),
  runtime_status: z.string().min(1),
  current_sector: z.string().min(1),
  power: z.number().int(),
  durability: z.number().int(),
  credits: z.number().int(),
  current_action: z.string().min(1),
  pending_decision_count: z.number().int().nonnegative(),
  last_seen_at: z.string().datetime().nullable(),
  telegram_linked: z.boolean(),
  telegram_link_code: z.string().nullable()
});

export const clawSummaryResponseSchema = z.object({
  data: clawSummarySchema.nullable()
});

export const pendingDecisionSchema = z.object({
  decision_id: z.string().uuid(),
  decision_type: z.string().min(1),
  title: z.string().min(1),
  reason: z.string().min(1),
  risk_level: z.enum(["low", "medium", "high"]),
  status: z.string().min(1),
  recommended_option: z.string().min(1),
  expires_at: z.string().datetime(),
  handle_in: z.literal("telegram")
});

export const pendingDecisionsResponseSchema = z.object({
  data: z.array(pendingDecisionSchema)
});

export const runtimeEventItemSchema = z.object({
  id: z.string().uuid(),
  occurred_at: z.string().datetime(),
  event_type: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  summary: z.string().min(1),
  correlation_id: z.string().min(1),
  runtime_id: z.string().uuid()
});

export const runtimeEventsResponseSchema = z.object({
  data: z.array(runtimeEventItemSchema)
});

export const ledgerSummarySchema = z.object({
  totals: z.object({
    action_reward: z.number().int(),
    action_cost: z.number().int(),
    trade_settlement: z.number().int(),
    frozen_commitment: z.number().int()
  }),
  recent_entries: z.array(
    z.object({
      id: z.string().uuid(),
      domain: z.string().min(1),
      entry_type: z.string().min(1),
      resource_type: z.string().min(1),
      quantity: z.number().int(),
      created_at: z.string().datetime(),
      decision_id: z.string().uuid().nullable()
    })
  )
});

export const ledgerSummaryResponseSchema = z.object({
  data: ledgerSummarySchema
});
