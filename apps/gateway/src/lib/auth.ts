import { hashRuntimeToken } from "./tokens";
import { AppError } from "./errors";

export const getRuntimeAuthToken = (headers: Record<string, unknown>): string => {
  const directHeader = headers["x-runtime-auth-token"];
  if (typeof directHeader === "string" && directHeader.length > 0) {
    return directHeader;
  }

  const authorization = headers.authorization;
  if (typeof authorization === "string" && authorization.startsWith("Bearer ")) {
    return authorization.slice("Bearer ".length).trim();
  }

  throw new AppError("RUNTIME_AUTH_TOKEN_MISSING", 401);
};

export const getRuntimeAuthTokenHash = (headers: Record<string, unknown>, secret: string): string =>
  hashRuntimeToken(getRuntimeAuthToken(headers), secret);

export const assertAdminSecret = (headers: Record<string, unknown>, expected: string): void => {
  const provided = headers["x-admin-secret"];
  if (typeof provided !== "string" || provided !== expected) {
    throw new AppError("ADMIN_SECRET_INVALID", 401);
  }
};

export const assertTelegramWebhookSecret = (headers: Record<string, unknown>, expected: string): void => {
  const provided = headers["x-telegram-bot-api-secret-token"];
  if (typeof provided !== "string" || provided !== expected) {
    throw new AppError("TELEGRAM_WEBHOOK_SECRET_INVALID", 401);
  }
};
