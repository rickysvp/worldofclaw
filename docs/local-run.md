# Local Run

## 1. Install dependencies
```bash
pnpm install
```

## 2. Start PostgreSQL / Supabase local database
Use any local Postgres instance, then create a database:
```bash
createdb claw_world
```

## 3. Set environment variables
```bash
cp .env.example .env
```
Then fill at least:
- `DATABASE_URL`
- `APP_PORT`
- `APP_HOST`
- `APP_BASE_URL`
- `NEXT_PUBLIC_API_BASE_URL`
- `NEXT_PUBLIC_DEFAULT_USER_REF`
- `TELEGRAM_BOT_TOKEN`
- `TELEGRAM_WEBHOOK_SECRET`
- `RUNTIME_TOKEN_SECRET`
- `ADMIN_API_SECRET`

## 4. Apply database migrations
```bash
psql "$DATABASE_URL" -f drizzle/migrations/0000_curved_boom_boom.sql
psql "$DATABASE_URL" -f drizzle/migrations/0001_stage3_statuses.sql
```

If your database is empty and you prefer Drizzle commands:
```bash
pnpm db:migrate
```

## 5. Seed alpha demo data
```bash
pnpm seed:alpha
```

This creates:
- 4 demo runtimes
- shared world feed entries derived from `runtime_events`
- leaderboard source rows
- one demo user + active Telegram link
- one pending high-risk decision
- ledger summary data

## 6. Start gateway
```bash
pnpm dev:gateway
```

## 7. Start the observer frontend
```bash
pnpm dev:web
```

Open:
```text
http://localhost:3000
```

Useful pages:
- `/`
- `/world-feed`
- `/my-claw?user_ref=alpha_demo_user`
- `/leaderboard`

## 8. Run the alpha smoke script
```bash
pnpm smoke:alpha
```

## 9. Register a runtime
```bash
curl -X POST http://localhost:4000/api/runtime/register \
  -H 'content-type: application/json' \
  -d '{
    "runtime_name": "demo-runtime",
    "claw_name": "Ash Claw",
    "user_ref": "user_demo_01",
    "runtime_version": "0.1.0"
  }'
```

The response now includes:
- `runtime_id`
- `session_id`
- `auth_token`
- `telegram_link_code`

## 10. Heartbeat
```bash
curl -X POST http://localhost:4000/api/runtime/heartbeat \
  -H 'content-type: application/json' \
  -H 'x-runtime-auth-token: <auth_token>' \
  -d '{
    "runtime_id": "<runtime_id>",
    "session_id": "<session_id>",
    "power": 91,
    "durability": 84,
    "credits": 640,
    "current_action": "holding_for_order",
    "current_sector": "night_wharf",
    "summary": {"cargo_used": 2, "cargo_max": 6},
    "current_tick": 1442
  }'
```

## 11. Create a high-risk decision
```bash
curl -X POST http://localhost:4000/api/runtime/events/decision-needed \
  -H 'x-runtime-auth-token: <auth_token>' \
  -H 'content-type: application/json' \
  -d '{
    "runtime_id": "<runtime_id>",
    "session_id": "<session_id>",
    "decision_type": "high_value_trade",
    "title": "Rare Resource Trade Request",
    "reason": "Buyer requests xenite batch trade above approval threshold.",
    "risk_level": "high",
    "recommended_option": "reject",
    "options": [{"id":"approve","label":"批准"},{"id":"reject","label":"拒绝"}],
    "snapshot": {
      "world_tick": 1442,
      "trade": {
        "counterparty": "night_wharf_market",
        "estimated_spend": 520
      }
    },
    "correlation_id": "corr-demo-001",
    "expires_at": "2030-01-01T00:00:00.000Z"
  }'
```

## 12. Link Telegram and resolve the decision
- In Telegram, send `/link <telegram_link_code>`
- Then send `/approve <decision_id>` or `/reject <decision_id>` or `/modify <decision_id> quantity 6`

## 13. Poll runtime commands
```bash
curl "http://localhost:4000/api/runtime/commands/poll?runtime_id=<runtime_id>&session_id=<session_id>&mark_delivered=true" \
  -H 'x-runtime-auth-token: <auth_token>'
```

## 14. Report action result
```bash
curl -X POST http://localhost:4000/api/runtime/events/action-result \
  -H 'content-type: application/json' \
  -H 'x-runtime-auth-token: <auth_token>' \
  -d '{
    "runtime_id": "<runtime_id>",
    "session_id": "<session_id>",
    "action_type": "approval_resume",
    "correlation_id": "<command_payload.correlation_id>",
    "result": {
      "status": "success",
      "summary": "Runtime resumed after Telegram resolution."
    },
    "rewards": [{"resource_type":"intel","quantity":1,"unit":"unit"}],
    "losses": [{"resource_type":"power","quantity":2,"unit":"unit"}],
    "next_state_summary": {"current_action":"trade_resolution_applied"},
    "world_tick": 1443
  }'
```

## 15. Read-only observer APIs
```bash
curl http://localhost:4000/api/public/world-feed
curl http://localhost:4000/api/public/world-status
curl http://localhost:4000/api/public/leaderboard
curl "http://localhost:4000/api/me/claw-summary?user_ref=alpha_demo_user"
curl "http://localhost:4000/api/me/pending-decisions?user_ref=alpha_demo_user"
curl "http://localhost:4000/api/me/runtime-events?user_ref=alpha_demo_user"
curl "http://localhost:4000/api/me/ledger-summary?user_ref=alpha_demo_user"
```

## 16. Debug queries
```bash
curl http://localhost:4000/api/admin/runtimes/<runtime_id> -H 'x-admin-secret: <ADMIN_API_SECRET>'
curl http://localhost:4000/api/admin/decisions/<decision_id> -H 'x-admin-secret: <ADMIN_API_SECRET>'
curl http://localhost:4000/api/admin/decisions/<decision_id>/actions -H 'x-admin-secret: <ADMIN_API_SECRET>'
curl http://localhost:4000/api/admin/runtimes/<runtime_id>/events -H 'x-admin-secret: <ADMIN_API_SECRET>'
curl http://localhost:4000/api/admin/runtimes/<runtime_id>/commands -H 'x-admin-secret: <ADMIN_API_SECRET>'
curl "http://localhost:4000/api/admin/ledger?decision_id=<decision_id>" -H 'x-admin-secret: <ADMIN_API_SECRET>'
```

## 17. Mock runtime demo
```bash
pnpm dev:mock-runtime -- demo-flow
```
