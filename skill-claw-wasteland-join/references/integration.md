# Integration reference

## Target API
- Default base URL: `http://localhost:8787`

## Required endpoints
1. `POST /agents/register`
2. `GET /agents/{id}/status`
3. `POST /agents/{id}/actions`
4. `GET /events`

## Action contract
- The caller must provide `action`, `powerCost`, `computeCost`
- Server enforces world rules:
  - insufficient power -> reject
  - insufficient compute -> reject

## Recommended client flow
1) register once
2) cache agent_id locally
3) before each action: fetch status
4) if low power: call charge or request market trade
