import type { AdminRequest, AdminResponse } from "../services/types";
import { authenticateAdmin } from "../middleware/auth";
import { replayCurrentWorldTick } from "../services/replay.service";
export const replayController = (request: AdminRequest): AdminResponse<Exclude<ReturnType<typeof replayCurrentWorldTick>, null> | never> => {
  const auth = authenticateAdmin(request.headers);
  if ("status" in auth) {
    return auth;
  }
  const result = replayCurrentWorldTick({
    ...(request.query?.tick ? { tick_number: Number(request.query.tick) } : {}),
    ...(request.query?.expected_checksum ? { expected_checksum: request.query.expected_checksum } : {})
  });
  if (!result) {
    return {
      status: 404,
      body: {
        ok: false,
        error_code: "ADMIN_REPLAY_NOT_FOUND",
        message: "Replay snapshot not found."
      }
    };
  }
  return {
    status: 200,
    body: {
      ok: true,
      data: result
    }
  };
};
