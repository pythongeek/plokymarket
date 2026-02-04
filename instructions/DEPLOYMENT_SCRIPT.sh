#!/bin/bash

# Polymarket BD - Automated Deployment Script
# Run this script to deploy all components

set -e

echo "🚀 Polymarket BD Deployment Script"
echo "==================================="
echo ""

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check prerequisites
check_prerequisites() {
    echo "📋 Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        echo -e "${RED}❌ Node.js not found. Please install Node.js 18+${NC}"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        echo -e "${RED}❌ npm not found. Please install npm${NC}"
        exit 1
    fi
    
    # Check Supabase CLI
    if ! command -v supabase &> /dev/null; then
        echo -e "${YELLOW}⚠️ Supabase CLI not found. Installing...${NC}"
        npm install -g supabase
    fi
    
    # Check Vercel CLI
    if ! command -v vercel &> /dev/null; then
        echo -e "${YELLOW}⚠️ Vercel CLI not found. Installing...${NC}"
        npm install -g vercel
    fi
    
    # Check Docker
    if ! command -v docker &> /dev/null; then
        echo -e "${YELLOW}⚠️ Docker not found. n8n deployment will be skipped${NC}"
        SKIP_DOCKER=true
    fi
    
    echo -e "${GREEN}✅ Prerequisites check complete${NC}"
    echo ""
}

# Deploy Supabase
deploy_supabase() {
    echo "🗄️ Deploying to Supabase..."
    
    if [ -z "$SUPABASE_PROJECT_REF" ]; then
        echo -e "${YELLOW}⚠️ SUPABASE_PROJECT_REF not set${NC}"
        echo "Please set your Supabase project reference:"
        echo "export SUPABASE_PROJECT_REF=your-project-ref"
        read -p "Enter Supabase project reference: " SUPABASE_PROJECT_REF
    fi
    
    # Link project
    echo "Linking to Supabase project..."
    supabase link --project-ref $SUPABASE_PROJECT_REF
    
    # Push migrations
    echo "Pushing database migrations..."
    supabase db push
    
    echo -e "${GREEN}✅ Supabase deployment complete${NC}"
    echo ""
}

# Deploy Vercel
deploy_vercel() {
    echo "🌐 Deploying to Vercel..."
    
    cd apps/web
    
    # Check if .env.local exists
    if [ ! -f .env.local ]; then
        echo -e "${YELLOW}⚠️ .env.local not found${NC}"
        echo "Creating .env.local template..."
        
        cat > .env.local << EOF
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# App
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
        
        echo -e "${RED}❌ Please update .env.local with your credentials${NC}"
        exit 1
    fi
    
    # Install dependencies
    echo "Installing dependencies..."
    npm install
    
    # Build
    echo "Building application..."
    npm run build
    
    # Deploy
    echo "Deploying to Vercel..."
    vercel --prod
    
    cd ../..
    
    echo -e "${GREEN}✅ Vercel deployment complete${NC}"
    echo ""
}

# Deploy n8n
deploy_n8n() {
    if [ "$SKIP_DOCKER" = true ]; then
        echo -e "${YELLOW}⚠️ Skipping n8n deployment (Docker not found)${NC}"
        return
    fi
    
    echo "🐳 Deploying n8n..."
    
    cd docker/n8n
    
    # Start containers
    echo "Starting n8n containers..."
    docker-compose up -d
    
    echo -e "${GREEN}✅ n8n deployment complete${NC}"
    echo "Access n8n at: http://localhost:5678"
    echo ""
    
    cd ../..
}

# Main deployment
main() {
    check_prerequisites
    
    echo "Select deployment option:"
    echo "1) Deploy All (Supabase + Vercel + n8n)"
    echo "2) Deploy Supabase Only"
    echo "3) Deploy Vercel Only"
    echo "4) Deploy n8n Only"
    read -p "Enter choice (1-4): " choice
    
    case $choice in
        1)
            deploy_supabase
            deploy_vercel
            deploy_n8n
            ;;
        2)
            deploy_supabase
            ;;
        3)
            deploy_vercel
            ;;
        4)
            deploy_n8n
            ;;
        *)
            echo -e "${RED}❌ Invalid choice${NC}"
            exit 1
            ;;
    esac
    
    echo ""
    echo -e "${GREEN}🎉 Deployment complete!${NC}"
    echo ""
    echo "Next steps:"
    echo "1. Configure environment variables in Vercel dashboard"
    echo "2. Update Supabase Auth settings with Vercel domain"
    echo "3. Test the application"
    echo ""
}

# Run main function
main
