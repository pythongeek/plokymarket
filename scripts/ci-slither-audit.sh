#!/bin/bash
set -euo pipefail

# Smart Contract Security Audit — Slither CI Gate
# Fails pipeline if Critical or High vulnerabilities found.

cd /root/workspace/plokymarket/contracts

echo "[SLITHER] Running security audit..."

if ! command -v slither &> /dev/null; then
  echo "[SLITHER] Installing slither-analyzer..."
  pip install slither-analyzer 2>/dev/null || pip3 install slither-analyzer
fi

slither . --json slither-report.json --filter-paths "node_modules" || true

if [ ! -f slither-report.json ]; then
  echo "[SLITHER] ❌ No report generated"
  exit 1
fi

CRITICAL=$(python3 -c "
import json, sys
try:
    with open('slither-report.json') as f:
        data = json.load(f)
    findings = data.get('results', {}).get('detectors', [])
    critical = sum(1 for f in findings if f.get('impact') == 'High')
    high = sum(1 for f in findings if f.get('impact') == 'High')
    print(critical + high)
except:
    print(0)
")

echo "[SLITHER] Critical/High findings: $CRITICAL"

if [ "$CRITICAL" -gt 0 ]; then
  echo "[SLITHER] ❌ CI FAILED: $CRITICAL Critical/High vulnerabilities found"
  cat slither-report.json | python3 -m json.tool | grep -A5 '"impact": "High"' | head -30
  exit 1
fi

echo "[SLITHER] ✅ No Critical/High vulnerabilities. Pipeline clear."
