import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getSectorView } from "../services/dashboard.service";
export const sectorsController= (request: AdminRequest): AdminResponse<ReturnType<typeof getSectorView>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getSectorView(request.query?.sector_id) } });
};
