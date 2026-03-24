import { z } from "zod";

export const worldFeedItemSchema = z.object({
  id: z.string().uuid(),
  occurred_at: z.string().datetime(),
  event_type: z.string().min(1),
  severity: z.enum(["low", "medium", "high", "critical"]),
  title: z.string().min(1),
  summary: z.string().min(1),
  claw_name: z.string().min(1),
  current_sector: z.string().nullable(),
  runtime_id: z.string().uuid()
});

export const worldFeedResponseSchema = z.object({
  data: z.array(worldFeedItemSchema)
});

export const leaderboardRowSchema = z.object({
  rank: z.number().int().positive(),
  runtime_id: z.string().uuid(),
  claw_name: z.string().min(1),
  runtime_status: z.string().min(1),
  current_sector: z.string().min(1),
  credits: z.number().int(),
  power: z.number().int(),
  durability: z.number().int(),
  last_seen_at: z.string().datetime().nullable()
});

export const leaderboardResponseSchema = z.object({
  data: z.array(leaderboardRowSchema)
});

export const worldStatusSchema = z.object({
  world_id: z.string().min(1),
  active_runtimes: z.number().int().nonnegative(),
  stale_runtimes: z.number().int().nonnegative(),
  offline_runtimes: z.number().int().nonnegative(),
  pending_decision_count: z.number().int().nonnegative(),
  latest_tick: z.number().int().nonnegative(),
  live_event_count: z.number().int().nonnegative(),
  latest_broadcast: z.string().nullable()
});

export const worldStatusResponseSchema = z.object({
  data: worldStatusSchema
});
