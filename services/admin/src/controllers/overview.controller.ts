import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getOverview } from "../services/dashboard.service";
export const overviewController= (request: AdminRequest): AdminResponse<ReturnType<typeof getOverview>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getOverview() } });
};
