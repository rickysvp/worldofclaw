import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getFacilityView } from "../services/dashboard.service";
export const facilitiesController= (request: AdminRequest): AdminResponse<ReturnType<typeof getFacilityView>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getFacilityView(request.query?.facility_id) } });
};
