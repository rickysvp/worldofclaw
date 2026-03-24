#!/usr/bin/env bash
set -euo pipefail
BASE="https://claw-wasteland.vercel.app/api"
TARGET="1407672458"

WORLD=$(curl -sS "$BASE/world")
LEAD=$(curl -sS "$BASE/leaderboard")

TICKS=$(echo "$WORLD" | sed -n 's/.*"ticks"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' | head -n1)
AGENTS=$(echo "$WORLD" | sed -n 's/.*"agents"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' | head -n1)
EVENTS=$(echo "$WORLD" | sed -n 's/.*"events"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' | head -n1)
RARE=$(echo "$WORLD" | sed -n 's/.*"totalRare"[[:space:]]*:[[:space:]]*\([0-9]*\).*/\1/p' | head -n1)

TOP=$(echo "$LEAD" | tr -d '\n' | sed -n 's/.*"name":"\([^"]*\)".*"score":\([0-9]*\).*/\1(\2)/p' | head -n1)
NOW=$(date -u '+%Y-%m-%d %H:%M UTC')

MSG="【Claw Wasteland 每小时简报】\n时间: $NOW\nTick: ${TICKS:-?}\n在线Claw: ${AGENTS:-?}\n活跃事件: ${EVENTS:-0}\n总稀土: ${RARE:-0}\n榜首: ${TOP:-暂无}\n\n世界正在持续演化中。"

timeout 25s openclaw message send --channel telegram --target "$TARGET" --message "$MSG" >/dev/null || true
