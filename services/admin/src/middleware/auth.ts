import type { AdminResponse } from "../services/types";

export const default_admin_token = "openclaw_admin_local_token" as const;

const extractBearer = (authorization: string | undefined): string | null =>
  authorization?.startsWith("Bearer ") ? authorization.slice("Bearer ".length) : null;

export const authenticateAdmin = (headers: Record<string, string | undefined> | undefined): { success: true } | AdminResponse<never> => {
  const expected_token = process.env.OPENCLAW_ADMIN_TOKEN ?? default_admin_token;
  const header_token = headers?.["x-admin-token"] ?? extractBearer(headers?.authorization);

  if (!header_token || header_token !== expected_token) {
    return {
      status: 401,
      body: {
        ok: false,
        error_code: "ADMIN_UNAUTHORIZED",
        message: "Missing or invalid admin token."
      }
    };
  }

  return { success: true };
};
