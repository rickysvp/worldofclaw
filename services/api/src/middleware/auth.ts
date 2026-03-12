import type { BridgeResponse } from "../../../../packages/skill-bridge/src";
import { getSessionByAccessToken } from "../services/session.service";

export const authenticate = (authorization_header: string | undefined): BridgeResponse<{ session_id: string }> | { success: true; session_id: string } => {
  const token = authorization_header?.startsWith("Bearer ") ? authorization_header.slice("Bearer ".length) : null;
  if (!token) {
    return {
      status: 401,
      body: {
        ok: false,
        error_code: "BRIDGE_INVALID_TOKEN",
        message: "Missing Bearer token."
      }
    };
  }

  const session_view = getSessionByAccessToken(token);
  if (!session_view) {
    return {
      status: 401,
      body: {
        ok: false,
        error_code: "BRIDGE_INVALID_TOKEN",
        message: "Invalid world access token."
      }
    };
  }

  if (session_view.session.status === "expired") {
    return {
      status: 401,
      body: {
        ok: false,
        error_code: "BRIDGE_TOKEN_EXPIRED",
        message: "World access token expired."
      }
    };
  }

  if (session_view.session.status === "replaced" || session_view.token.revoked_at_seconds !== null || session_view.session.status === "revoked") {
    return {
      status: 409,
      body: {
        ok: false,
        error_code: "BRIDGE_SESSION_REPLACED",
        message: "Session has been replaced by a newer claim."
      }
    };
  }

  return { success: true, session_id: session_view.session.session_id };
};
