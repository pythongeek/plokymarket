#!/bin/bash
# ============================================================================
# Production CLOB Deployment Script
# Better Than Polymarket - Bangladesh Prediction Market
# ============================================================================

set -e

echo "🚀 Plokymarket Production CLOB Deployment"
echo "=========================================="

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if running in correct directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}❌ Error: Must run from project root${NC}"
    exit 1
fi

echo ""
echo -e "${YELLOW}Step 1: Verification${NC}"
echo "===================="

# Check required migrations exist locally
echo "Checking local migrations..."
REQUIRED_MIGRATIONS=(
    "007_clob_system.sql"
    "008_clob_functions.sql"
    "021_advanced_matching_engine.sql"
    "050_market_creation_workflow.sql"
)

for mig in "${REQUIRED_MIGRATIONS[@]}"; do
    if [ -f "supabase/migrations/$mig" ]; then
        echo -e "${GREEN}✓${NC} Found: $mig"
    else
        echo -e "${RED}✗${NC} Missing: $mig"
        echo "This migration is REQUIRED for CLOB to work"
        exit 1
    fi
done

echo ""
echo -e "${YELLOW}Step 2: File Copy${NC}"
echo "=================="

# Copy new service files
mkdir -p apps/web/src/lib/services

cp "Event fix final try/EventService.ts" apps/web/src/lib/services/ 2>/dev/null || true
cp "Event fix final try/types.ts" apps/web/src/lib/services/ 2>/dev/null || true

echo -e "${GREEN}✓${NC} Service files copied"

echo ""
echo -e "${YELLOW}Step 3: Type Generation${NC}"
echo "======================="

# Generate types if supabase CLI available
if command -v supabase &> /dev/null; then
    echo "Generating Supabase types..."
    supabase gen types typescript --project-id "$SUPABASE_PROJECT_ID" --schema public > apps/web/src/types/supabase.ts 2>/dev/null || \
    echo "Skipping type generation (no project ID)"
else
    echo "Supabase CLI not found, skipping type generation"
fi

echo ""
echo -e "${YELLOW}Step 4: Build Test${NC}"
echo "=================="

cd apps/web
npm run build 2>&1 | tee build.log

if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓${NC} Build successful"
else
    echo -e "${RED}✗${NC} Build failed"
    echo "Check build.log for errors"
    exit 1
fi

cd ../..

echo ""
echo "=========================================="
echo -e "${GREEN}✅ LOCAL PREPARATION COMPLETE${NC}"
echo "=========================================="
echo ""
echo "NEXT STEPS (Manual on Vercel):"
echo ""
echo "1. Go to Vercel Dashboard → Storage → Supabase"
echo "2. Open SQL Editor"
echo "3. Run: vercel_cleanup_script.sql"
echo "4. Run: 142_production_clob_system.sql"
echo "5. Deploy to Vercel: vercel --prod"
echo ""
echo "Files ready for deployment:"
ls -la "Event fix final try/"
echo ""
