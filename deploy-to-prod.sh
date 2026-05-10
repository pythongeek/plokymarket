#!/bin/bash
set -euo pipefail

# =============================================================================
# Plokymarket Deploy Script
# Syncs workspace source → production VPS, rebuilds, restarts
# =============================================================================

PROD_HOST="root@204.168.167.195"
PROD_DIR="/root/plokymarket"
LOCAL_DIR="/root/workspace/plokymarket"

echo "[DEPLOY] ============================================"
echo "[DEPLOY] Starting deploy to $PROD_HOST"
echo "[DEPLOY] ============================================"

# -----------------------------------------------------------------------------
# STEP 1: Sync source code (exclude generated/build dirs)
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 1: Syncing source files..."

rsync -avz --delete \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='standalone/' \
  --exclude='.git/' \
  --exclude='*.log' \
  --exclude='.env*.local' \
  --exclude='storage/' \
  --exclude='coverage/' \
  --exclude='.turbo/' \
  --exclude='out/' \
  --exclude='dist/' \
  "$LOCAL_DIR/apps/web/src/" \
  "$PROD_HOST:$PROD_DIR/apps/web/src/"

echo "[DEPLOY] Source sync complete"

# Also sync any config files that might have changed
rsync -avz \
  --exclude='node_modules/' \
  --exclude='.next/' \
  --exclude='standalone/' \
  "$LOCAL_DIR/apps/web/next.config.js" \
  "$LOCAL_DIR/apps/web/package.json" \
  "$LOCAL_DIR/apps/web/tsconfig.json" \
  "$LOCAL_DIR/apps/web/tailwind.config.ts" \
  "$LOCAL_DIR/apps/web/postcss.config.mjs" \
  "$PROD_HOST:$PROD_DIR/apps/web/" 2>/dev/null || true

# Sync public/ if it exists locally
if [ -d "$LOCAL_DIR/apps/web/public" ]; then
  rsync -avz --delete \
    "$LOCAL_DIR/apps/web/public/" \
    "$PROD_HOST:$PROD_DIR/apps/web/public/"
fi

# -----------------------------------------------------------------------------
# STEP 2: SSH to production — rebuild & restart
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 2: Building on production..."

ssh "$PROD_HOST" bash -s << 'REMOTESCRIPT'
set -euo pipefail

cd /root/plokymarket/apps/web

echo "[PROD] Installing dependencies (if needed)..."
npm install 2>&1 | tail -5

echo "[PROD] Cleaning old build..."
rm -rf .next standalone

echo "[PROD] Building Next.js..."
npm run build 2>&1 | tee /tmp/build.log | tail -30

echo "[PROD] Verifying standalone output..."
if [ ! -d ".next/standalone" ]; then
  echo "[PROD] ERROR: standalone output missing!"
  exit 1
fi

echo "[PROD] Copying standalone to deploy dir..."
rm -rf /root/plokymarket/standalone
mkdir -p /root/plokymarket/standalone

# Copy standalone server files
cp -r .next/standalone/. /root/plokymarket/standalone/

# CRITICAL: Next.js puts static files in .next/static/, NOT in .next/standalone/.next/static/
# Must copy them separately
cp -r .next/static /root/plokymarket/standalone/.next/static

# Also copy public/ if not already in standalone
if [ -d "public" ]; then
  cp -r public/. /root/plokymarket/standalone/public/ 2>/dev/null || true
fi

echo "[PROD] Verifying static chunks..."
CHUNK_COUNT=$(ls /root/plokymarket/standalone/.next/static/chunks/ 2>/dev/null | wc -l)
echo "[PROD] Static chunks: $CHUNK_COUNT"

if [ "$CHUNK_COUNT" -eq 0 ]; then
  echo "[PROD] ERROR: No static chunks! Build failed silently."
  exit 1
fi

echo "[PROD] Restarting PM2 with ecosystem config..."
cd /opt && pm2 restart pm2-ecosystem.config.js --only plokymarket --update-env

echo "[PROD] Build complete!"
REMOTESCRIPT

# -----------------------------------------------------------------------------
# STEP 3: Verify deployment
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 3: Verifying deployment..."
sleep 3

HEALTH_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "https://polymarketbd.com/api/health" || echo "000")
echo "[DEPLOY] Health check: HTTP $HEALTH_STATUS"

if [ "$HEALTH_STATUS" = "200" ]; then
  echo "[DEPLOY] ✅ Deployment successful!"
else
  echo "[DEPLOY] ⚠️ Health check returned $HEALTH_STATUS — may need manual check"
fi

echo "[DEPLOY] ============================================"
echo "[DEPLOY] Done. Site: https://polymarketbd.com"
echo "[DEPLOY] Admin:  https://polymarketbd.com/sys-cmd-7x9k2"
echo "[DEPLOY] Auth:   https://polymarketbd.com/auth-portal-3m5n8"
echo "[DEPLOY] ============================================"
