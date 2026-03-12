import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { getLedgerView } from "../services/dashboard.service";
export const ledgersController= (request: AdminRequest): AdminResponse<ReturnType<typeof getLedgerView>> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  return ({ status: 200, body: { ok: true, data: getLedgerView(request.query?.entity_id) } });
};
