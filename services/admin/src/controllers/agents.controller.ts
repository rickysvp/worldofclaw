import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getAgentView } from "../services/dashboard.service";
export const agentsController= (request: AdminRequest): AdminResponse<ReturnType<typeof getAgentView>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getAgentView(request.query?.agent_id) } });
};
