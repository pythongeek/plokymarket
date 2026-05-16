#!/bin/bash
set -euo pipefail

# =============================================================================
# Security Scan Suite — Nikto + Header Validation
# =============================================================================

TARGET=${1:-"https://polymarketbd.com"}
REPORT_DIR="/tmp/security-reports"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

mkdir -p "$REPORT_DIR"

echo "[SCAN] ══════════════════════════════════════════════════════════════════════════════"
echo "[SCAN] Target: $TARGET"
echo "[SCAN] Report: $REPORT_DIR/report-$TIMESTAMP.txt"

# ── 1. Nikto Baseline Scan ──────────────────────────────────────────────────────────────────────────────────────
echo "[SCAN] Running Nikto..."

if command -v nikto &> /dev/null; then
  nikto -h "$TARGET" -Tuning x 6 -timeout 30 \
    -output "$REPORT_DIR/nikto-$TIMESTAMP.txt" 2>/dev/null || true
else
  echo "[SCAN] Nikto not installed. Install: apt install nikto"
fi

# ── 2. Header Security Audit ───────────────────────────────────────────────────────────────────────────────────────
echo "[SCAN] Auditing security headers..."

HEADERS=$(curl -sI "$TARGET" | tr '[:upper:]' '[:lower:]')
REPORT_FILE="$REPORT_DIR/headers-$TIMESTAMP.txt"

check_header() {
  local header=$1
  local expected=$2
  if echo "$HEADERS" | grep -q "$header"; then
    echo "✅ $header: present" >> "$REPORT_FILE"
  else
    echo "❌ $header: MISSING (expected: $expected)" >> "$REPORT_FILE"
  fi
}

echo "Security Header Audit — $TARGET — $TIMESTAMP" > "$REPORT_FILE"
echo "================================================" >> "$REPORT_FILE"

check_header "strict-transport-security" "max-age=63072000"
check_header "content-security-policy" "strict-dynamic"
check_header "x-frame-options" "DENY"
check_header "x-content-type-options" "nosniff"
check_header "referrer-policy" "strict-origin-when-cross-origin"

# Check TLS version
echo "" >> "$REPORT_FILE"
echo "TLS Version Check:" >> "$REPORT_FILE"
TLS_INFO=$(echo | openssl s_client -connect "${TARGET#https://}:443" -tls1_3 2>/dev/null | grep -i "protocol" || echo "TLS 1.3: UNKNOWN")
echo "$TLS_INFO" >> "$REPORT_FILE"

echo "" >> "$REPORT_FILE"
echo "CSP Analysis:" >> "$REPORT_FILE"
CSP=$(echo "$HEADERS" | grep "content-security-policy" | head -1 || echo "")
if echo "$CSP" | grep -q "unsafe-eval"; then
  echo "❌ CSP contains unsafe-eval" >> "$REPORT_FILE"
else
  echo "✅ CSP has no unsafe-eval" >> "$REPORT_FILE"
fi

cat "$REPORT_FILE"

# ── 3. Rate Limiting Test ─────────────────────────────────────────────────────────────────────────────────────────
echo ""
echo "[SCAN] Testing rate limiting (50 rapid requests)..."

RATE_RESULTS=$(for i in $(seq 1 50); do
  curl -s -o /dev/null -w "%{http_code}" "$TARGET/api/health"
done | sort | uniq -c)

echo "Rate Limit Results:" >> "$REPORT_FILE"
echo "$RATE_RESULTS" >> "$REPORT_FILE"
echo "$RATE_RESULTS"

echo ""
echo "[SCAN] ✅ Scan complete. Reports in $REPORT_DIR/"
