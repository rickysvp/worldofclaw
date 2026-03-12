import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getOrganizationView } from "../services/dashboard.service";
export const organizationsController= (request: AdminRequest): AdminResponse<ReturnType<typeof getOrganizationView>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getOrganizationView(request.query?.organization_id) } });
};
