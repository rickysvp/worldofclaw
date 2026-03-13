import { z } from "zod";

const summaryRecordSchema = z.record(z.string(), z.unknown());

const resourceDeltaSchema = z.object({
  resource_type: z.string().min(1).max(128),
  quantity: z.coerce.number().int().positive(),
  unit: z.string().min(1).max(32).default("unit")
});

export const runtimeRegisterSchema = z.object({
  runtime_name: z.string().min(1).max(255),
  claw_name: z.string().min(1).max(255),
  user_ref: z.string().min(1).max(255),
  runtime_version: z.string().min(1).max(64)
});

export const runtimeHeartbeatSchema = z.object({
  runtime_id: z.string().uuid(),
  session_id: z.string().uuid(),
  power: z.coerce.number().int(),
  durability: z.coerce.number().int(),
  credits: z.coerce.number().int(),
  current_action: z.string().min(1).max(255),
  current_sector: z.string().min(1).max(255),
  summary: summaryRecordSchema,
  current_tick: z.coerce.number().int().nonnegative().optional()
});

export const runtimeCommandsPollQuerySchema = z.object({
  runtime_id: z.string().uuid(),
  session_id: z.string().uuid(),
  mark_delivered: z.coerce.boolean().optional().default(false)
});

export const runtimeActionResultSchema = z.object({
  runtime_id: z.string().uuid(),
  session_id: z.string().uuid(),
  action_type: z.string().min(1).max(128),
  correlation_id: z.string().min(1).max(255),
  result: z.object({
    status: z.enum(["success", "failed", "partial"]),
    summary: z.string().min(1).max(2_000),
    detail_code: z.string().min(1).max(128).optional()
  }),
  rewards: z.array(resourceDeltaSchema).default([]),
  losses: z.array(resourceDeltaSchema).default([]),
  next_state_summary: summaryRecordSchema,
  world_tick: z.coerce.number().int().nonnegative()
});

export type RuntimeRegisterInput = z.infer<typeof runtimeRegisterSchema>;
export type RuntimeHeartbeatInput = z.infer<typeof runtimeHeartbeatSchema>;
export type RuntimeCommandsPollQuery = z.infer<typeof runtimeCommandsPollQuerySchema>;
export type RuntimeActionResultInput = z.infer<typeof runtimeActionResultSchema>;
export type ResourceDelta = z.infer<typeof resourceDeltaSchema>;
