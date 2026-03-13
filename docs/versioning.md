# Versioning Policy

## Goal
Provide a stable, traceable version label for every release milestone and every historical mainline commit that matters for rollback, replay, and audit.

## Scheme
We use semantic versioning for release baselines and ordered historical tags for intermediate mainline commits.

- Final release tag format: `vMAJOR.MINOR.PATCH`
- Historical backfill tag format: `vMAJOR.MINOR.PATCH-history.N`
- Future pre-release tag format (optional): `vMAJOR.MINOR.PATCH-rc.N`

## Current Baseline
- Release baseline: `v0.1.1`

## Historical Mapping Rule
For commits that are part of the first-parent `main` history before a release baseline:
- earliest retained commit -> `v0.1.1-history.1`
- next retained commit -> `v0.1.1-history.2`
- release commit -> `v0.1.1`

## Future Release Rule
For future releases:
1. Bump root/package workspace versions together.
2. Generate/update `docs/version-history.json`.
3. Tag candidate builds with `vX.Y.Z-rc.N` when needed.
4. Tag release commit with `vX.Y.Z`.

## Commands
- Show tags: `git tag --list --sort=version:refname`
- Show mainline history: `git log --oneline --first-parent main`
- Show current version label: `node scripts/version-history.js current`
- Show version history table: `node scripts/version-history.js table`
