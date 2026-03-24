# Online Smoke Deployment

This is the smallest path to a real deployment check for World of Claw.

## Goal

Run a black-box smoke test against a deployed gateway after the backend, database, and alpha seed data are ready.

## Recommended shape

- Deploy `apps/gateway` as the backend service.
- Use Supabase or Postgres for `DATABASE_URL`.
- Seed alpha data with `pnpm seed:alpha`.
- Point the smoke workflow at the deployed gateway URL.
- Deploy `apps/openclaw-agent-world` separately as the frontend.

## Gateway deployment

Recommended target: Railway.

Use the repo root as the source checkout, then configure these commands for the service:

```bash
pnpm install --frozen-lockfile
pnpm build:gateway
pnpm --filter @claw-world/gateway start
```

Required env:

- `DATABASE_URL`
- `APP_PORT`
- `APP_HOST=0.0.0.0`
- `APP_BASE_URL`
- `RUNTIME_TOKEN_SECRET`
- `ADMIN_API_SECRET`
- `NODE_ENV=production`

Early smoke runs can keep these placeholder values if Telegram is not part of the validation scope yet:

- `TELEGRAM_BOT_TOKEN=telegram_bot_token_placeholder`
- `TELEGRAM_WEBHOOK_SECRET=telegram_webhook_secret_placeholder`
- `TELEGRAM_BOT_API_BASE_URL=https://api.telegram.org`

## Database bootstrap

Before running smoke:

```bash
pnpm db:migrate
pnpm seed:alpha
```

This must run with the deployed database credentials in `DATABASE_URL`.

## Frontend deployment

Recommended target: Vercel.

Create a Vercel project with `apps/openclaw-agent-world` as the Root Directory.

Required frontend env:

- `NEXT_PUBLIC_API_BASE_URL=https://<your-gateway-domain>`
- `NEXT_PUBLIC_DEFAULT_USER_REF=alpha_demo_user`

The checked-in Vercel config for that sub-app is:

- `apps/openclaw-agent-world/vercel.json`

## GitHub Actions smoke workflow

Use:

- `.github/workflows/online-smoke.yml`

It supports two trigger styles:

1. Manual run with a `base_url` input.
2. `repository_dispatch` with type `online-smoke`.

Recommended repository settings:

- Repository variable or secret: `ALPHA_SMOKE_BASE_URL`
- Optional repository variable: `ALPHA_SMOKE_USER_REF`
- Optional secrets if Telegram should be real: `TELEGRAM_BOT_TOKEN`, `TELEGRAM_WEBHOOK_SECRET`

## What the smoke covers

The smoke script:

- checks `/health`
- checks `/api/public/world-feed`
- checks `/api/me/claw-summary`
- checks pending decisions and ledger summary
- runs the mock runtime demo flow against the deployed gateway

Source:

- `scripts/alpha-smoke.ts`

## Rollout order

1. Deploy the gateway.
2. Run migrations.
3. Run alpha seed.
4. Run the GitHub Actions smoke workflow against the deployed URL.
5. Deploy the frontend once the gateway smoke is green.
