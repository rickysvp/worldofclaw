# Telegram Setup

## 1. Create the bot
1. Talk to BotFather.
2. Create a bot and copy the bot token.
3. Put the token into `TELEGRAM_BOT_TOKEN`.

## 2. Configure webhook secret
Choose a random secret and place it in `TELEGRAM_WEBHOOK_SECRET`.

## 3. Expose the gateway
For local testing, expose the gateway with any HTTPS tunnel, for example:

```bash
ngrok http 4000
```

Assume the tunnel URL is:

```text
https://example-tunnel.ngrok-free.app
```

## 4. Register the Telegram webhook
```bash
curl -X POST "https://api.telegram.org/bot<TELEGRAM_BOT_TOKEN>/setWebhook" \
  -H 'content-type: application/json' \
  -d '{
    "url": "https://example-tunnel.ngrok-free.app/api/telegram/webhook",
    "secret_token": "<TELEGRAM_WEBHOOK_SECRET>"
  }'
```

## 5. Link the chat to a runtime owner
1. Register a runtime through `/api/runtime/register`.
2. Copy `telegram_link_code` from the response.
3. In Telegram, send:

```text
/link <telegram_link_code>
```

The gateway will activate the matching `telegram_links` record and bind the current chat.

## 6. Available Telegram commands
- `/start`
- `/link <code>`
- `/status`
- `/approve <decision_id>`
- `/reject <decision_id>`
- `/modify <decision_id> quantity <value>`
- `/modify <decision_id> budget_cap <value>`
- `/modify <decision_id> route_risk <value>`

## 7. Validation and safety rules
- Webhook requests must include `x-telegram-bot-api-secret-token`.
- Only linked chats can use `/status` or resolve decisions.
- Decision commands verify the decision belongs to the linked user runtime.
- Duplicate Telegram messages are idempotent through `idempotency_keys`.
- Free-form text never becomes executable runtime control.
