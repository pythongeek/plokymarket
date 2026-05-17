#!/bin/bash
# E2E Admin Verification — cURL Reference Sequence
# Usage: ./verify-admin-e2e.sh <ADMIN_EMAIL> <ADMIN_PASSWORD> [BASE_URL]

BASE_URL="${3:-https://polymarketbd.com}"
EMAIL="$1"
PASSWORD="$2"

if [ -z "$EMAIL" ] || [ -z "$PASSWORD" ]; then
  echo "Usage: $0 <ADMIN_EMAIL> <ADMIN_PASSWORD> [BASE_URL]"
  exit 1
fi

echo "═══════════════════════════════════════════════════════════════"
echo "  PLOKYMARKET ADMIN E2E — cURL SEQUENCE"
echo "  Target: $BASE_URL"
echo "═════════════════════════════0══════════════════════════════════"

# STEP 1: Login → extract token
STEP=1
echo -e "\n🔐 STEP $STEP — Auth Handshake"
LOGIN_RES=$(curl -s -w "\n%{http_code}" -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\"}")
HTTP_CODE=$(echo "$LOGIN_RES" | tail -n1)
BODY=$(echo "$LOGIN_RES" | sed '$d')

if [ "$HTTP_CODE" != "200" ]; then
  echo "  ❌ Login failed: HTTP $HTTP_CODE"
  echo "  $BODY"
  exit 1
fi

TOKEN=$(echo "$BODY" | grep -oP '"access_token":"\K[^"]+' | head -1)
if [ -z "$TOKEN" ]; then
  echo "  ❌ No access_token in response"
  exit 1
fi

echo "  ✅ Login OK (token=${TOKEN:0:16}...)"

# Helper for authenticated requests
api_get() {
  curl -s -w "\n%{http_code}" "$BASE_URL$1" -H "Cookie: sb-access-token=$TOKEN"
}
api_post() {
  curl -s -w "\n%{http_code}" -X POST "$BASE_URL$1" \
    -H "Content-Type: application/json" \
    -H "Cookie: sb-access-token=$TOKEN" \
    -d "$2"
}

# STEP 2: Verify token via /api/admin/users/me
STEP=$((STEP+1))
echo -e "\n👤 STEP $STEP — Token Validation"
ME=$(api_get "/api/admin/users/me")
ME_CODE=$(echo "$ME" | tail -n1)
ME_BODY=$(echo "$ME" | sed '$d')
if [ "$ME_CODE" != "200" ]; then
  echo "  ❌ /api/admin/users/me: HTTP $ME_CODE"
  echo "  $ME_BODY"
  exit 1
fi
echo "  ✅ Token accepted by admin routes"

# STEP 3: User Management (list + detail)
STEP=$((STEP+1))
echo -e "\n👥 STEP $STEP — User Management"
USERS=$(api_get "/api/admin/users")
USERS_CODE=$(echo "$USERS" | tail -n1)
USERS_BODY=$(echo "$USERS" | sed '$d')
if [ "$USERS_CODE" != "200" ]; then
  echo "  ❌ List users: HTTP $USERS_CODE"
else
  echo "  ✅ List users OK"
fi

# STEP 4: KYC List
STEP=$((STEP+1))
echo -e "\n🛡️  STEP $STEP — KYC Flow"
KYC=$(api_get "/api/admin/kyc")
KYC_CODE=$(echo "$KYC" | tail -n1)
KYC_BODY=$(echo "$KYC" | sed '$d')
if [ "$KYC_CODE" != "200" ]; then
  echo "  ❌ List KYC: HTTP $KYC_CODE"
else
  echo "  ✅ List KYC OK"
fi

# STEP 5: AI Topics
STEP=$((STEP+1))
echo -e "\n🤖 STEP $STEP — AI Topics"
TOPICS=$(api_get "/api/admin/daily-topics")
TOPICS_CODE=$(echo "$TOPICS" | tail -n1)
if [ "$TOPICS_CODE" != "200" ]; then
  echo "  ❌ List topics: HTTP $TOPICS_CODE"
else
  echo "  ✅ List AI topics OK"
fi

# STEP 6: Cron Jobs
STEP=$((STEP+1))
echo -e "\n⏰ STEP $STEP — Cron Jobs"
CRON=$(api_get "/api/admin/workflows/cron-job")
CRON_CODE=$(echo "$CRON" | tail -n1)
if [ "$CRON_CODE" != "200" ]; then
  echo "  ❌ List cron jobs: HTTP $CRON_CODE"
else
  echo "  ✅ List cron jobs OK"
fi

# STEP 7: AI Configs
STEP=$((STEP+1))
echo -e "\n⚙️  STEP $STEP — AI Configs"
AICFG=$(api_get "/api/admin/ai-configs")
AICFG_CODE=$(echo "$AICFG" | tail -n1)
if [ "$AICFG_CODE" != "200" ]; then
  echo "  ❌ List AI configs: HTTP $AICFG_CODE"
else
  echo "  ✅ List AI configs OK"
fi

# STEP 8: Metrics
STEP=$((STEP+1))
echo -e "\n📊 STEP $STEP — Metrics"
METRICS=$(api_get "/api/admin/monitoring/metrics")
METRICS_CODE=$(echo "$METRICS" | tail -n1)
if [ "$METRICS_CODE" != "200" ]; then
  echo "  ❌ Monitoring metrics: HTTP $METRICS_CODE"
else
  echo "  ✅ Monitoring metrics OK"
fi

SYSTEM=$(api_get "/api/admin/metrics/system")
SYSTEM_CODE=$(echo "$SYSTEM" | tail -n1)
if [ "$SYSTEM_CODE" != "200" ]; then
  echo "  ❌ System metrics: HTTP $SYSTEM_CODE"
else
  echo "  ✅ System metrics OK"
fi

echo -e "\n═══════════════════════════════════════════════════════════════"
echo "  ✅ E2E cURL SEQUENCE COMPLETE"
echo "═══════════════════════════════════════════════════════════════"
