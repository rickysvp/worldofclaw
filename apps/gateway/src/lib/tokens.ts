import { createHash, randomBytes } from "node:crypto";

export const generateRuntimeToken = (): string => randomBytes(24).toString("hex");

export const hashRuntimeToken = (token: string, secret: string): string =>
  createHash("sha256").update(`${token}:${secret}`).digest("hex");

export const hashIdempotencyRequest = (payload: unknown): string =>
  createHash("sha256").update(JSON.stringify(payload)).digest("hex");
