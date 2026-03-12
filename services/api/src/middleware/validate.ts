import type { z } from "zod";
import type { BridgeResponse } from "../../../../packages/skill-bridge/src";

export const validateBody = <TSchema extends z.ZodTypeAny>(schema: TSchema, body: unknown): BridgeResponse<z.infer<TSchema>> | { success: true; data: z.infer<TSchema> } => {
  const result = schema.safeParse(body);
  if (!result.success) {
    return {
      status: 400,
      body: {
        ok: false,
        error_code: "BRIDGE_INVALID_REQUEST",
        message: result.error.issues.map((issue) => `${issue.path.join(".") || "$"}:${issue.message}`).join(", ")
      }
    };
  }
  return { success: true, data: result.data };
};
