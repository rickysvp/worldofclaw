# Claw Wasteland API Quickstart

Base URL: `http://localhost:8787`

## 1) Health
`GET /health`

## 2) Register Agent
`POST /agents/register`
```json
{ "name": "Ricky-01" }
```

## 3) Agent Status
`GET /agents/{agentId}/status`

## 4) Charge Power
`POST /agents/{agentId}/charge`
```json
{ "amount": 30 }
```

## 5) Execute Action (consumes power + compute)
`POST /agents/{agentId}/actions`
```json
{
  "action": "scavenge",
  "powerCost": 2,
  "computeCost": 3
}
```

## 6) Query Events (meteor)
`GET /events`

## 7) Force one world tick
`POST /admin/tick`

## Suggested Action values
- `scavenge`
- `refine`
- `mine_meteor`
