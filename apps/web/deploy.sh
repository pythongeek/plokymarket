#!/bin/bash

# Polymarket BD Deployment Script
# Run this script to deploy to Vercel

set -e

echo "🚀 Starting Polymarket BD Deployment..."
echo "===================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo -e "${YELLOW}⚠️  .env.local not found. Creating from template...${NC}"
    cp .env.example .env.local
    echo -e "${RED}❗ Please edit .env.local with your Supabase credentials!${NC}"
    echo ""
    echo "Your .env.local has been created. Please add your credentials:"
    echo "  NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co"
    echo "  NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key"
    echo "  SUPABASE_SERVICE_ROLE_KEY=your-service-role-key"
    echo ""
    exit 1
fi

# Check if credentials are set
if grep -q "your-anon-key" .env.local || grep -q "your-project.supabase.co" .env.local; then
    echo -e "${RED}❗ Please update .env.local with your actual Supabase credentials!${NC}"
    exit 1
fi

# Navigate to web directory
cd "$(dirname "$0")"

echo ""
echo -e "${GREEN}📦 Installing dependencies...${NC}"
npm ci

echo ""
echo -e "${GREEN}🔨 Building application...${NC}"
npm run build

echo ""
echo -e "${GREEN}✅ Build successful!${NC}"
echo ""

# Check if vercel CLI is installed
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
    echo "   git add ."
    echo "   git commit -m \"Deploy\""
    echo "   git push"
    echo ""
    echo "3. Or manually deploy from Vercel dashboard:"
    echo "   - Go to vercel.com"
    echo "   - Import your GitHub repository"
    echo "   - Add environment variables"
    echo "   - Deploy!"
fi

echo ""
echo "===================================="
echo -e "${GREEN}🎉 Deployment process complete!${NC}"
echo ""
