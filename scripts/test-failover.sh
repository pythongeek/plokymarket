#!/bin/bash
set -euo pipefail

# =============================================================================
# AI Failover Test — Kill MiniMax, verify Nginx routes to Vertex
# =============================================================================

MINIMAX_PORT=9001
VERTEX_PORT=9002
NGINX_HOST="https://polymarketbd.com"
TEST_ENDPOINT="$NGINX_HOST/api/ai/test"

echo "[FAILOVER] ══════════════════════════════════════════════════════════════════════════════"

# ── 1. Baseline: Both services healthy ───────────────────────────────────────────────────────────────
echo "[FAILOVER] Step 1: Baseline health check..."

BASELINE=$(curl -s -o /dev/null -w "%{http_code}|%{header_x-ai-provider}" "$TEST_ENDPOINT" || echo "000|")
echo "[FAILOVER] Baseline: HTTP ${BASELINE%%|*} | Provider: ${BASELINE##*|}"

if [ "${BASELINE%%|*}" != "200" ]; then
  echo "[FAILOVER] ❌ Baseline failed. Services may not be running."
  exit 1
fi

# ── 2. Kill MiniMax ──────────────────────────────────────────────────────────────────────
echo "[FAILOVER] Step 2: Killing MiniMax on port $MINIMAX_PORT..."

MINIMAX_PID=$(lsof -t -i:$MINIMAX_PORT 2>/dev/null || echo "")
if [ -n "$MINIMAX_PID" ]; then
  kill -9 "$MINIMAX_PID"
  echo "[FAILOVER] MiniMax killed (PID: $MINIMAX_PID)"
else
  echo "[FAILOVER] MiniMax not running on port $MINIMAX_PORT (simulating failure)"
fi

# Wait for Nginx to detect upstream failure
sleep 3

# ── 3. Verify fallback to Vertex ─────────────────────────────────────────────────────────────────────
echo "[FAILOVER] Step 3: Testing fallback routing..."

SUCCESS=0
for i in {1..5}; do
  RESULT=$(curl -s -o /dev/null -w "%{http_code}|%{header_x-ai-provider}|%{header_x-ai-fallback}" "$TEST_ENDPOINT" || echo "000||")
  HTTP_CODE="${RESULT%%|*}"
  PROVIDER="$(echo "$RESULT" | cut -d'|' -f2)"
  FALLBACK="$(echo "$RESULT" | cut -d'|' -f3)"

  echo "[FAILOVER] Request $i: HTTP $HTTP_CODE | Provider: $PROVIDER | Fallback: $FALLBACK"

  if [ "$HTTP_CODE" = "200" ] && [ "$FALLBACK" = "vertex" ]; then
    SUCCESS=1
    break
  fi

  sleep 2
done

# ── 4. Restore MiniMax ─────────────────────────────────────────────────────────────────────
echo "[FAILOVER] Step 4: Restoring MiniMax..."

# Restart MiniMax proxy via PM2
pm2 restart minimax-proxy 2>/dev/null || echo "[FAILOVER] Manual restart needed: pm2 restart minimax-proxy"

sleep 3

# ── 5. Verify recovery ─────────────────────────────────────────────────────────────────────────
echo "[FAILOVER] Step 5: Verifying MiniMax recovery..."

RECOVERY=$(curl -s -o /dev/null -w "%{http_code}|%{header_x-ai-provider}" "$TEST_ENDPOINT" || echo "000|")
echo "[FAILOVER] Recovery: HTTP ${RECOVERY%%|*} | Provider: ${RECOVERY##*|}"

echo "[FAILOVER] ══════════════════════════════════════════════════════════════════════════════"

if [ "$SUCCESS" -eq 1 ]; then
  echo "[FAILOVER] ✅ FAILOVER VERIFIED: MiniMax → Vertex fallback works."
  exit 0
else
  echo "[FAILOVER] ❌ FAILOVER FAILED: Requests did not route to Vertex."
  exit 1
fi
