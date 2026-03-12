import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getWorldHealth } from "../services/dashboard.service";
export const worldHealthController= (request: AdminRequest): AdminResponse<ReturnType<typeof getWorldHealth>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getWorldHealth() } });
};
