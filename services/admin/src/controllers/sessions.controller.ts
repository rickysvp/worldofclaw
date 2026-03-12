import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getSessionView } from "../services/dashboard.service";
export const sessionsController= (request: AdminRequest): AdminResponse<ReturnType<typeof getSessionView>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getSessionView(request.query?.session_id) } });
};
