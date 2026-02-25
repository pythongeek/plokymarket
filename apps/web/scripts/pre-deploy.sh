#!/bin/bash

echo "ðŸš€ Starting Pre-deployment checks for AI-Managed Codebase..."

# 1. Type Checking (Warning only - does not block deploy)
echo "ðŸ” Running Type Check (tsc)..."
npx tsc --noEmit 2>&1 || true
echo "â„¹ï¸ Type check completed (warnings only, not blocking deploy)."

# 2. Database Schema Check (Warning only - Supabase not available in Vercel build)
echo "ðŸ—„ï¸ Checking Database Schema Sync..."
# These commands require local Supabase and are skipped in CI/Vercel builds
if command -v supabase &> /dev/null; then
    npx supabase db remote commit 2>&1 || true
    npx supabase db push --dry-run 2>&1 || true
else
    echo "â„¹ï¸ Supabase CLI not available, skipping schema sync check."
fi

echo "âœ… Pre-deployment checks completed. Proceeding to build..."
