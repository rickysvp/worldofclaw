import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1).default("postgres://postgres:postgres@127.0.0.1:5432/claw_world"),
  APP_PORT: z.coerce.number().int().positive().default(4000),
  APP_HOST: z.string().min(1).default("0.0.0.0"),
  APP_BASE_URL: z.string().url().default("http://localhost:4000"),
  TELEGRAM_BOT_TOKEN: z.string().min(1).default("telegram_bot_token_placeholder"),
  TELEGRAM_WEBHOOK_SECRET: z.string().min(1).default("telegram_webhook_secret_placeholder"),
  TELEGRAM_BOT_API_BASE_URL: z.string().url().default("https://api.telegram.org"),
  RUNTIME_TOKEN_SECRET: z.string().min(16).default("runtime_token_secret_dev"),
  ADMIN_API_SECRET: z.string().min(8).default("dev_admin_secret"),
  HEARTBEAT_STALE_AFTER_SECONDS: z.coerce.number().int().positive().default(120),
  DECISION_TIMEOUT_SCAN_INTERVAL_MS: z.coerce.number().int().positive().default(15_000),
  DECISION_TIMEOUT_BATCH_SIZE: z.coerce.number().int().positive().default(50),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development")
});

export type Env = z.infer<typeof envSchema>;

export const env = envSchema.parse(process.env);
