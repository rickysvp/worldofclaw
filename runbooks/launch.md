# Launch Runbook

1. Verify `npm run test:m12`, `npm run test:unit`, and `npm run test:integration` are green.
2. Run staging smoke for skill bridge, onboarding, billing, audit, and admin.
3. Confirm go/no-go decision is `go`.
4. Create verified recovery snapshot before deploy.
5. Deploy world engine, api, admin, and platform services.
6. Run postdeploy smoke.
7. Monitor alerts, queue backlog, stale sessions, and billing reconcile for the first 30 minutes.
