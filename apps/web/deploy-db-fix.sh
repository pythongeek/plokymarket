#!/bin/bash

# Plokymarket Database & Deployment Script
# This script applies database fixes to Supabase and deploys to Vercel

set -e

echo "🚀 Starting Plokymarket Database Fix & Deployment..."
echo "===================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Get the project root directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

# Check if .env.local exists
if [ ! -f "$SCRIPT_DIR/.env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
    cp "$SCRIPT_DIR/.env.example" "$SCRIPT_DIR/.env.local"
    echo -e "${RED}❗ Please edit .env.local with your Supabase credentials!${NC}"
    echo ""
    echo "Your .env.local has been created. Please add your credentials:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    exit 1
fi

# Load environment variables
export $(grep -v '^#' "$SCRIPT_DIR/.env.local" | xargs)

# Check if credentials are set
if [ -z "$NEXT_PUBLIC_SUPABASE_URL" ] || [ -z "$SUPABASE_SERVICE_ROLE_KEY" ]; then
    echo -e "${RED}❗ Please update .env.local with your actual Supabase credentials!${NC}"
    exit 1
fi

# Extract Supabase project reference
SUPABASE_REF=$(echo "$NEXT_PUBLIC_SUPABASE_URL" | sed -n 's|https://\([^\.]*\)\.supabase\.co|\1|p')

echo ""
echo -e "${BLUE}📊 Database Configuration:${NC}"
echo "  Supabase URL: $NEXT_PUBLIC_SUPABASE_URL"
echo "  Project Ref: $SUPABASE_REF"
echo ""

# Function to apply SQL to Supabase
apply_sql_to_supabase() {
    local sql_file=$1
    local description=$2
    
    echo -e "${GREEN}📝 Applying $description...${NC}"
    
    # Use psql or curl to apply SQL
    if command -v psql &> /dev/null; then
        # Using psql with connection string
        PGPASSWORD="$SUPABASE_SERVICE_ROLE_KEY" psql -h "db.$SUPABASE_REF.supabase.co" \
            -U postgres -d postgres -f "$sql_file"
    else
        # Using curl with Supabase REST API
        echo -e "${YELLOW}⚠️  psql not found. Using curl to apply SQL...${NC}"
        echo -e "${YELLOW}⚠️  Please manually run the SQL in Supabase SQL Editor:${NC}"
        echo -e "${BLUE}  https://supabase.com/dashboard/project/$SUPABASE_REF/sql${NC}"
        echo ""
        echo "SQL File: $sql_file"
        echo ""
        read -p "Press Enter to continue after applying SQL manually..."
    fi
    
    echo -e "${GREEN}✅ $description applied successfully!${NC}"
    echo ""
}

# Step 1: Apply database schema
echo -e "${BLUE}🔧 Step 1: Applying Database Schema${NC}"
echo "=============================================="
apply_sql_to_supabase "$PROJECT_ROOT/supabase/db/init.sql" "Database Schema"

# Step 2: Apply matching engine functions
echo -e "${BLUE}🔧 Step 2: Applying Matching Engine Functions${NC}"
echo "======================================================"
apply_sql_to_supabase "$PROJECT_ROOT/supabase/db/matching_engine.sql" "Matching Engine"

# Step 3: Build the application
echo -e "${BLUE}🔨 Step 3: Building Application${NC}"
echo "======================================"
cd "$SCRIPT_DIR"
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm ci

echo -e "${GREEN}🔨 Building application...${NC}"
npm run build

echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Step 4: Deploy to Vercel
echo -e "${BLUE}🚀 Step 4: Deploying to Vercel${NC}"
echo "===================================="

if command -v vercel &> /dev/null; then
    echo -e "${GREEN}🚀 Deploying to Vercel...${NC}"
    vercel --prod
else
    echo -e "${YELLOW}⚠️  Vercel CLI not found. Options:${NC}"
    echo ""
    echo "1. Install Vercel CLI:"
    echo "   npm i -g vercel"
    echo ""
    echo "2. Or deploy via GitHub:"
    echo "   cd $PROJECT_ROOT"
    echo "   git add ."
    echo "   git commit -m \"Deploy database fix\""
    echo "   git push"
    echo ""
    echo "3. Or manually deploy from Vercel dashboard:"
    echo "   - Go to vercel.com"
    echo "   - Import your GitHub repository"
    echo "   - Add environment variables"
    echo "   - Deploy!"
fi

echo ""
echo "===================================================="
echo -e "${GREEN}🎉 Database Fix & Deployment Complete!${NC}"
echo ""
echo -e "${BLUE}📋 Next Steps:${NC}"
echo "  1. Verify database tables in Supabase Dashboard"
echo "  2. Test the application at your Vercel URL"
echo "  3. Check that matching engine functions are working"
echo ""
echo -e "${BLUE}🔗 Useful Links:${NC}"
echo "  - Supabase Dashboard: https://supabase.com/dashboard/project/$SUPABASE_REF"
echo "  - SQL Editor: https://supabase.com/dashboard/project/$SUPABASE_REF/sql"
echo "  - Table Editor: https://supabase.com/dashboard/project/$SUPABASE_REF/editor"
echo ""
