#!/bin/bash
set -euo pipefail

# =============================================================================
# Plokymarket Blue/Green Atomic Deployment
# Zero-downtime via symlink swap. Rollback ready.
# =============================================================================

PROD_HOST="root@204.168.167.195"
PROD_DIR="/root/plokymarket"
LOCAL_DIR="/root/workspace/plokymarket"
DEPLOY_ROOT="/opt/plokymarket-deploys"
NGINX_STATIC_ROOT="/var/www/plokymarket-static"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BLUE_DIR="$DEPLOY_ROOT/blue"
GREEN_DIR="$DEPLOY_ROOT/green"
CURRENT_LINK="$DEPLOY_ROOT/current"

echo "[DEPLOY] ══════════════════════════════════════════════════════════════════════════════"
echo "[DEPLOY] Blue/Green deploy to $PROD_HOST | $TIMESTAMP"
echo "[DEPLOY] ══════════════════════════════════════════════════════════════════════════════"

# -----------------------------------------------------------------------------
# STEP 1: Determine target (blue or green)
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 1: Determining target environment..."

TARGET_DIR=$GREEN_DIR
ROLLBACK_DIR=$BLUE_DIR

if ssh "$PROD_HOST" "test -L $CURRENT_LINK && readlink $CURRENT_LINK | grep -q green" 2>/dev/null; then
  TARGET_DIR=$BLUE_DIR
  ROLLBACK_DIR=$GREEN_DIR
fi

echo "[DEPLOY] Target: $TARGET_DIR | Rollback: $ROLLBACK_DIR"

# -----------------------------------------------------------------------------
# STEP 2: Sync source to target
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 2: Syncing source to target..."

ssh "$PROD_HOST" "mkdir -p $TARGET_DIR/apps/web"

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
  "$PROD_HOST:$TARGET_DIR/apps/web/src/"

rsync -avz \
  "$LOCAL_DIR/apps/web/next.config.js" \
  "$LOCAL_DIR/apps/web/package.json" \
  "$LOCAL_DIR/apps/web/tsconfig.json" \
  "$LOCAL_DIR/apps/web/tailwind.config.ts" \
  "$LOCAL_DIR/apps/web/postcss.config.mjs" \
  "$PROD_HOST:$TARGET_DIR/apps/web/" 2>/dev/null || true

if [ -d "$LOCAL_DIR/apps/web/public" ]; then
  rsync -avz --delete \
    "$LOCAL_DIR/apps/web/public/" \
    "$PROD_HOST:$TARGET_DIR/apps/web/public/"
fi

# -----------------------------------------------------------------------------
# STEP 3: Build in target directory
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 3: Building in target directory..."

ssh "$PROD_HOST" bash -s << REMOTESCRIPT
set -euo pipefail
TARGET_DIR="$TARGET_DIR"
NGINX_STATIC_ROOT="$NGINX_STATIC_ROOT"

cd "$TARGET_DIR/apps/web"

echo "[PROD] Installing dependencies..."
npm install 2>&1 | tail -5

echo "[PROD] Building Next.js..."
rm -rf .next standalone
npm run build 2>&1 | tee /tmp/build-$TIMESTAMP.log | tail -30

echo "[PROD] Verifying standalone..."
if [ ! -d ".next/standalone" ]; then
  echo "[PROD] ERROR: standalone output missing!"
  exit 1
fi

# Copy standalone to target deploy root
rm -rf "$TARGET_DIR/standalone"
cp -r .next/standalone "$TARGET_DIR/standalone"
cp -r .next/static "$TARGET_DIR/standalone/.next/static"
cp -r public/. "$TARGET_DIR/standalone/public/" 2>/dev/null || true

# Sync static assets to Nginx serving directory (exact parity)
echo "[PROD] Syncing static assets to Nginx..."
rm -rf "$NGINX_STATIC_ROOT/.next"
mkdir -p "$NGINX_STATIC_ROOT/.next"
cp -r .next/static "$NGINX_STATIC_ROOT/.next/static"
cp -r public/. "$NGINX_STATIC_ROOT/public/" 2>/dev/null || true

# Verify hash parity
echo "[PROD] Verifying static hash parity..."
find "$TARGET_DIR/standalone/.next/static" -type f -exec sha256sum {} \; | sort > /tmp/target-hashes.txt
find "$NGINX_STATIC_ROOT/.next/static" -type f -exec sha256sum {} \; | sort > /tmp/nginx-hashes.txt

if ! diff -q /tmp/target-hashes.txt /tmp/nginx-hashes.txt > /dev/null; then
  echo "[PROD] ERROR: Static asset hash mismatch!"
  diff /tmp/target-hashes.txt /tmp/nginx-hashes.txt | head -20
  exit 1
fi

echo "[PROD] Static parity verified."
REMOTESCRIPT

# -----------------------------------------------------------------------------
# STEP 4: Pre-flight health check on target
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 4: Pre-flight health check..."

ssh "$PROD_HOST" bash -s << REMOTESCRIPT
set -euo pipefail
TARGET_DIR="$TARGET_DIR"

cd "$TARGET_DIR/apps/web"

# Start target app on ephemeral port
PORT=3999 NODE_ENV=production node "$TARGET_DIR/standalone/server.js" &
PID=\$!
sleep 5

HEALTH=\$(curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:3999/api/health || echo "000")
kill \$PID 2>/dev/null || true

if [ "\$HEALTH" != "200" ]; then
  echo "[PROD] ERROR: Pre-flight health check failed (HTTP \$HEALTH)"
  exit 1
fi

echo "[PROD] Pre-flight health: HTTP 200"
REMOTESCRIPT

# -----------------------------------------------------------------------------
# STEP 5: Atomic symlink swap (zero downtime)
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 5: Atomic symlink swap..."

ssh "$PROD_HOST" bash -s << REMOTESCRIPT
set -euo pipefail
TARGET_DIR="$TARGET_DIR"
CURRENT_LINK="$CURRENT_LINK"

# Create/update symlink atomically
ln -sfn "\$TARGET_DIR" "\$CURRENT_LINK"

echo "[PROD] Symlink updated: \$CURRENT_LINK -> \$(readlink \$CURRENT_LINK)"
REMOTESCRIPT

# -----------------------------------------------------------------------------
# STEP 6: Zero-downtime PM2 reload
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 6: Zero-downtime PM2 reload..."

ssh "$PROD_HOST" bash -s << REMOTESCRIPT
set -euo pipefail

# PM2 reload sends SIGUSR2, new workers start, old ones drain
pm2 reload /opt/pm2-ecosystem.config.js --only plokymarket --update-env

# Wait for new workers
sleep 3
REMOTESCRIPT

# -----------------------------------------------------------------------------
# STEP 7: Post-deploy verification
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 7: Post-deploy verification..."

for i in {1..5}; do
  HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "https://polymarketbd.com/api/health" || echo "000")
  echo "[DEPLOY] Health check $i/5: HTTP $HEALTH"

  if [ "$HEALTH" = "200" ]; then
    echo "[DEPLOY] ✅ Deployment successful!"
    break
  fi

  if [ "$i" -eq 5 ]; then
    echo "[DEPLOY] ❌ Health check failed after 5 attempts. Initiating rollback..."
    # Rollback: swap symlink back to previous
    ssh "$PROD_HOST" "ln -sfn $ROLLBACK_DIR $CURRENT_LINK && pm2 reload /opt/pm2-ecosystem.config.js --only plokymarket --update-env"
    echo "[DEPLOY] ↩️ Rolled back to $ROLLBACK_DIR"
    exit 1
  fi

  sleep 3
done

# -----------------------------------------------------------------------------
# STEP 8: Cleanup old builds (keep last 5)
# -----------------------------------------------------------------------------
echo "[DEPLOY] Step 8: Cleanup..."

ssh "$PROD_HOST" bash -s << REMOTESCRIPT
set -euo pipefail
DEPLOY_ROOT="$DEPLOY_ROOT"
# Keep only last 5 deploy directories
cd "\$DEPLOY_ROOT"
ls -t | tail -n +6 | xargs -r rm -rf 2>/dev/null || true
REMOTESCRIPT

echo "[DEPLOY] ══════════════════════════════════════════════════════════════════════════════"
echo "[DEPLOY] ✅ Done. Site: https://polymarketbd.com"
echo "[DEPLOY] Rollback: ln -sfn $ROLLBACK_DIR $CURRENT_LINK && pm2 reload ..."
echo "[DEPLOY] ══════════════════════════════════════════════════════════════════════════════"
