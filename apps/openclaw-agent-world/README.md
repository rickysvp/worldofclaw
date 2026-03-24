# OpenClaw Observer Panel

Alpha observer frontend for World of Claw.

## Purpose

- Telegram remains the primary decision surface.
- This frontend is a read-only observer panel.
- All operational data should be loaded from the gateway API.

## Local development

1. Install dependencies from the monorepo root:
   `pnpm install`
2. Create local env:
   `cp apps/openclaw-agent-world/.env.example apps/openclaw-agent-world/.env.local`
3. Set:
   - `NEXT_PUBLIC_API_BASE_URL`
   - `NEXT_PUBLIC_DEFAULT_USER_REF`
4. Run:
   `pnpm dev:web`

## Deploy

- Recommended frontend hosting: Vercel
- Recommended backend hosting: Railway
- Recommended database: Supabase Postgres
- In Vercel, set the project Root Directory to `apps/openclaw-agent-world`.
- Set `NEXT_PUBLIC_API_BASE_URL` to the deployed gateway URL before promoting a frontend build.

The panel expects the gateway to expose:

- `/api/public/world-feed`
- `/api/public/leaderboard`
- `/api/public/world-status`
- `/api/me/claw-summary`
- `/api/me/pending-decisions`
- `/api/me/runtime-events`
- `/api/me/ledger-summary`
