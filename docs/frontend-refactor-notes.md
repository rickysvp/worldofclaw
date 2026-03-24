# Frontend Refactor Notes

## Removed AI Studio / Gemini pieces
- Removed Gemini-specific environment variables from `apps/openclaw-agent-world/.env.example`.
- Removed AI Studio run instructions from `apps/openclaw-agent-world/README.md`.
- Removed the old mock-data dependency chain by deleting:
  - `apps/openclaw-agent-world/apps/web/lib/mock-data.ts`
  - `apps/openclaw-agent-world/apps/web/components/EntryCard.tsx`
- Removed unused demo-era package dependencies like `express`, `concurrently`, and `@types/express`.

## UI design kept intact
- Preserved the CRT overlay, scanline treatment, mono font stack, industrial border style, and dark wasteland visual language.
- Preserved the single-page terminal aesthetic and component primitives in `apps/openclaw-agent-world/apps/web/components/ui.tsx`.
- Kept the frontend as a distinct visual observer rather than redesigning it into a dashboard template.

## Demo-generated logic replaced with real API reads
- `Landing` now reads world status and latest broadcasts from gateway.
- `World Feed` now renders from `/api/public/world-feed`.
- `My Claw` now renders from `/api/me/claw-summary`, `/api/me/pending-decisions`, `/api/me/runtime-events`, and `/api/me/ledger-summary`.
- `Leaderboard` now renders from `/api/public/leaderboard`.
- Landing 已合并接入说明，明确把 decision handling 指回 Telegram。

## Product boundary kept explicit
- No approve, reject, or modify actions exist in the frontend.
- Telegram remains the operator decision surface.
- The frontend is intentionally read-only and keyed by `user_ref` for alpha instead of a full account system.
