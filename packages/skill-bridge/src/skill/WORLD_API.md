# World API

Supported routes:
- `POST /register`
- `POST /claim`
- `POST /heartbeat`
- `GET /world/state`
- `GET /world/jobs`
- `POST /submit-action`
- `POST /event-ack`

Write routes require `idempotency_key`.

The skill must only submit structured actions. The world bridge validates and queues them for the existing action system.
