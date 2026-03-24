# Alpha Operator Runbook

## How to view runtime status
- Use `/api/public/world-status` for aggregate counts.
- Use `/api/me/claw-summary?user_ref=<user_ref>` for a single operator-facing view.
- Use `/api/admin/runtimes/<runtime_id>` with `x-admin-secret` for raw runtime detail.

## How to view decision status
- Use `/api/me/pending-decisions?user_ref=<user_ref>` for observer-facing pending work.
- Use `/api/admin/decisions/<decision_id>` for the decision row.
- Use `/api/admin/decisions/<decision_id>/actions` for `system_created`, `telegram_sent`, `approved`, `rejected`, `modified`, or `expired`.

## How to view command_outbox
- Use `/api/admin/runtimes/<runtime_id>/commands`.
- Confirm whether commands are `queued`, `delivered`, `acknowledged`, or `failed`.
- If Telegram action has already happened but no command exists, inspect the matching `decision_actions` row first.

## How to view ledger entries
- Use `/api/me/ledger-summary?user_ref=<user_ref>` for a compressed operator view.
- Use `/api/admin/ledger?owner_id=<runtime_id>` for raw rows.
- Filter by `decision_id` during approval or rejection investigations.

## How to handle Telegram not delivering
1. Call Telegram `getWebhookInfo`.
2. Verify the webhook URL still points to Railway.
3. Verify `x-telegram-bot-api-secret-token` matches `TELEGRAM_WEBHOOK_SECRET`.
4. Inspect gateway logs for `/api/telegram/webhook`.
5. If the decision is still open, resend context manually in Telegram after webhook repair.

## How to handle runtime not recovering
1. Verify recent `POST /api/runtime/heartbeat`.
2. Check `/api/runtime/commands/poll` delivery status through admin/debug routes.
3. Confirm the runtime is using the current auth token.
4. If a command is `queued`, poll manually from mock-runtime.
5. If a command is `delivered` but no `action-result` arrived, inspect runtime logs and resend `action-result` with the original correlation id.

## How to handle duplicate approve or idempotency anomalies
1. Inspect `decision_actions` for duplicate Telegram attempts.
2. Inspect `idempotency_keys` by scope and correlation if needed from SQL.
3. Confirm only one `command_outbox` resolution command was generated.
4. If user reports duplicate Telegram responses but gateway state is correct, treat it as a client retry and do not manually create a second command.
5. If duplicate commands exist, quarantine the later command as `failed` and preserve audit evidence.
