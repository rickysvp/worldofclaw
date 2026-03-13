# Environment Variables

## Required
- `DATABASE_URL`: PostgreSQL / Supabase connection string.
- `APP_PORT`: Gateway listening port.
- `APP_HOST`: Gateway listening host.
- `APP_BASE_URL`: Public base URL used in runtime register responses.
- `TELEGRAM_BOT_TOKEN`: Telegram Bot token. This phase only reserves the variable.
- `TELEGRAM_WEBHOOK_SECRET`: Telegram webhook secret. This phase only reserves the variable.
- `RUNTIME_TOKEN_SECRET`: Secret used to hash runtime auth tokens.
- `NODE_ENV`: `development` / `test` / `production`.

## Railway example
```env
DATABASE_URL=postgresql://postgres:postgres@127.0.0.1:5432/claw_world
APP_PORT=4000
APP_HOST=0.0.0.0
APP_BASE_URL=https://your-gateway.up.railway.app
TELEGRAM_BOT_TOKEN=telegram_bot_token_placeholder
TELEGRAM_WEBHOOK_SECRET=telegram_webhook_secret_placeholder
RUNTIME_TOKEN_SECRET=replace_with_long_secret
NODE_ENV=production
```

## Supabase note
Use the direct Postgres connection string from Supabase for `DATABASE_URL`.
