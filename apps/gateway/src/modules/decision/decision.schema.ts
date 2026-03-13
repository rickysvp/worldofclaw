import { z } from "zod";

export const decisionNeededSchema = z.object({
  runtime_id: z.string().uuid(),
  session_id: z.string().uuid(),
  decision_type: z.string().min(1).max(128),
  title: z.string().min(1).max(255),
  reason: z.string().min(1).max(2_000),
  risk_level: z.enum(["low", "medium", "high"]),
  recommended_option: z.string().min(1).max(128),
  options: z.array(z.record(z.string(), z.unknown())).min(1),
  snapshot: z.record(z.string(), z.unknown()),
  correlation_id: z.string().min(1).max(255),
  expires_at: z.string().datetime()
});

export const decisionModifyFieldSchema = z.enum(["quantity", "budget_cap", "route_risk"]);

export type DecisionNeededInput = z.infer<typeof decisionNeededSchema>;
export type DecisionModifyField = z.infer<typeof decisionModifyFieldSchema>;
