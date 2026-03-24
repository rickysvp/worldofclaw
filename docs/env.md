# Environment Variables

## Gateway required
- `DATABASE_URL`: Supabase or Postgres connection string.
- `APP_PORT`: Gateway listening port.
- `APP_HOST`: Gateway listening host.
- `APP_BASE_URL`: Public gateway URL used in runtime responses and docs.
- `TELEGRAM_BOT_TOKEN`: Telegram bot token for webhook send/receive.
- `TELEGRAM_WEBHOOK_SECRET`: Secret validated on `POST /api/telegram/webhook`.
- `TELEGRAM_BOT_API_BASE_URL`: Usually `https://api.telegram.org`.
- `RUNTIME_TOKEN_SECRET`: Secret used to hash runtime auth tokens.
- `ADMIN_API_SECRET`: Dev/admin debug route secret.
- `HEARTBEAT_STALE_AFTER_SECONDS`: Runtime stale threshold.
- `DECISION_TIMEOUT_SCAN_INTERVAL_MS`: In-process timeout job interval.
- `DECISION_TIMEOUT_BATCH_SIZE`: Timeout scan batch size.
- `NODE_ENV`: `development`, `test`, or `production`.

## Frontend required
- `NEXT_PUBLIC_API_BASE_URL`: Base URL used by the observer panel for all gateway reads.
- `NEXT_PUBLIC_DEFAULT_USER_REF`: Default viewer identity used by `/my-claw` in alpha, because frontend auth is intentionally not shipped.

## Local example
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/claw_world
APP_PORT=4000
APP_HOST=0.0.0.0
APP_BASE_URL=http://localhost:4000
NEXT_PUBLIC_API_BASE_URL=http://localhost:4000
NEXT_PUBLIC_DEFAULT_USER_REF=alpha_demo_user
TELEGRAM_BOT_TOKEN=telegram_bot_token_placeholder
TELEGRAM_WEBHOOK_SECRET=telegram_webhook_secret_placeholder
TELEGRAM_BOT_API_BASE_URL=https://api.telegram.org
RUNTIME_TOKEN_SECRET=replace_with_long_secret
ADMIN_API_SECRET=dev_admin_secret
HEARTBEAT_STALE_AFTER_SECONDS=120
DECISION_TIMEOUT_SCAN_INTERVAL_MS=15000
DECISION_TIMEOUT_BATCH_SIZE=50
NODE_ENV=development
```

## Railway gateway example
```env
DATABASE_URL=postgresql://postgres.<project>:<password>@aws-0-<region>.pooler.supabase.com:6543/postgres
APP_PORT=4000
APP_HOST=0.0.0.0
APP_BASE_URL=https://worldofclaw-gateway.up.railway.app
TELEGRAM_BOT_TOKEN=<bot token>
TELEGRAM_WEBHOOK_SECRET=<long random secret>
TELEGRAM_BOT_API_BASE_URL=https://api.telegram.org
RUNTIME_TOKEN_SECRET=<long random secret>
ADMIN_API_SECRET=<long random secret>
HEARTBEAT_STALE_AFTER_SECONDS=120
DECISION_TIMEOUT_SCAN_INTERVAL_MS=15000
DECISION_TIMEOUT_BATCH_SIZE=50
NODE_ENV=production
```

## Vercel frontend example
```env
NEXT_PUBLIC_API_BASE_URL=https://worldofclaw-gateway.up.railway.app
NEXT_PUBLIC_DEFAULT_USER_REF=alpha_demo_user
```

## Domain wiring
- Railway serves the gateway and Telegram webhook endpoint.
- Vercel serves `apps/openclaw-agent-world`.
- `NEXT_PUBLIC_API_BASE_URL` must point to the Railway gateway domain.
- `APP_BASE_URL` must point to the same Railway gateway domain.

## Supabase notes
- Prefer the direct or pooler Postgres connection string from Supabase for `DATABASE_URL`.
- Run SQL migrations before seed scripts.
- The alpha seed script is safe to rerun because it uses fixed IDs and upserts.
