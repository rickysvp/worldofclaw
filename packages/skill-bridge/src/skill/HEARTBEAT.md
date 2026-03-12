# Heartbeat Contract

Heartbeat cadence is server-driven.

Request fields:
- `session_id`
- `agent_id`
- `tick_seen`
- `sent_at_seconds`
- `liveness`
- `capabilities`
- `local_digest`
- `alerts`
- `idempotency_key`

Response fields:
- `server_tick`
- `session_status`
- `next_heartbeat_after_seconds`
- `sync_flags`
- `world_hints`

A heartbeat does not execute actions. It only updates liveness and sync state.
