# Alpha Launch Checklist

## Release pre-check
- Confirm `pnpm install` completes without lockfile drift.
- Confirm `pnpm build:gateway` and `pnpm build:web` pass.
- Confirm `pnpm typecheck:web` and gateway TypeScript checks pass.
- Confirm `.env` or platform env does not contain any Gemini or AI Studio variables.
- Confirm frontend points to the real gateway through `NEXT_PUBLIC_API_BASE_URL`.

## Database migration check
- Run `drizzle/migrations/0000_curved_boom_boom.sql`.
- Run `drizzle/migrations/0001_stage3_statuses.sql`.
- Verify core tables exist in Supabase.
- Verify `decision_status`, `runtime_status`, and `command_outbox_status` enums include the alpha states.

## Seed check
- Run `pnpm seed:alpha`.
- Confirm `alpha_demo_user` exists.
- Confirm at least 4 runtimes exist.
- Confirm at least 1 pending high-risk decision exists.
- Confirm ledger entries exist for the demo runtime.

## Telegram webhook check
- Verify `TELEGRAM_BOT_TOKEN` and `TELEGRAM_WEBHOOK_SECRET`.
- Call `setWebhook` against the Railway domain.
- Call `getWebhookInfo` and verify no active error message.
- Register one runtime and complete `/link <code>` end to end.

## Frontend API connectivity check
- Open the landing page and verify world status loads.
- Open `/world-feed` and verify at least one entry renders.
- Open `/my-claw?user_ref=alpha_demo_user` and verify claw summary, pending decisions, runtime events, and ledger summary all load.
- Open `/leaderboard` and verify rows are real API data, not demo placeholders.

## Mock runtime check
- Run `pnpm dev:mock-runtime -- register`.
- Run `pnpm dev:mock-runtime -- heartbeat`.
- Run `pnpm dev:mock-runtime -- create-decision`.
- Resolve the decision in Telegram.
- Run `pnpm dev:mock-runtime -- poll --mark-delivered`.
- Run `pnpm dev:mock-runtime -- ack-result`.

## Smoke check
- Run `pnpm smoke:alpha`.
- Confirm every check prints `PASS`.

## Rollback steps
1. Point Vercel back to the previous deployment.
2. Point Railway back to the previous gateway deployment.
3. Re-run the previous stable environment variable set.
4. If seed data introduced confusion, delete only the fixed alpha seed IDs rather than resetting the full database.
5. Re-run smoke checks against the rolled-back environment.
