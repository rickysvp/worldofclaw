# Incident Runbook

- Tick stall: verify snapshot freshness, run replay verification, restart stalled worker if needed.
- Queue backlog: drain backlog, inspect queue growth rate, confirm backlog is zero.
- Stale session: expire dead sessions, confirm reconnect flow works.
- Ledger drift: run reconcile, stop billing settlement until drift is zero.
