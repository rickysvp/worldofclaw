import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getActiveAlerts } from "../services/alert.service";
export const alertsController= (request: AdminRequest): AdminResponse<ReturnType<typeof getActiveAlerts>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getActiveAlerts() } });
};
