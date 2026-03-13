# Rollback Runbook

1. Freeze writes.
2. Select the latest verified snapshot before the bad deploy.
3. Restore snapshot.
4. Apply rollback plan for the target tick.
5. Replay verify the restored state.
6. Reopen traffic only after checksum and health checks pass.
