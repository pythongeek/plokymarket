#!/bin/bash

# ====================================================================
# PLOKYMARKET - AUTOMATED DEPLOYMENT SCRIPT
# ====================================================================
# This script automates the complete deployment process for Plokymarket
# Run: chmod +x deploy.sh && ./deploy.sh
# ====================================================================

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Helper functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# ====================================================================
# STEP 1: CHECK PREREQUISITES
# ====================================================================

print_header "STEP 1: Checking Prerequisites"

# Check Node.js
if command_exists node; then
    NODE_VERSION=$(node -v)
    print_success "Node.js installed: $NODE_VERSION"
else
    print_error "Node.js not found"
    print_info "Install from: https://nodejs.org/"
    exit 1
fi

# Check npm
if command_exists npm; then
    NPM_VERSION=$(npm -v)
    print_success "npm installed: $NPM_VERSION"
else
    print_error "npm not found"
    exit 1
fi

# Check Git
if command_exists git; then
    GIT_VERSION=$(git --version)
    print_success "Git installed: $GIT_VERSION"
else
    print_error "Git not found"
    exit 1
fi

# Check/Install Supabase CLI
if ! command_exists supabase; then
    print_warning "Supabase CLI not found. Installing..."
    npm install -g supabase
    print_success "Supabase CLI installed"
else
    print_success "Supabase CLI installed"
fi

# Check/Install Vercel CLI
if ! command_exists vercel; then
    print_warning "Vercel CLI not found. Installing..."
    npm install -g vercel
    print_success "Vercel CLI installed"
else
    print_success "Vercel CLI installed"
fi

# Optional: Check Docker
if command_exists docker; then
    print_success "Docker installed (optional for n8n)"
    DOCKER_AVAILABLE=true
else
    print_warning "Docker not found (n8n deployment will be skipped)"
    DOCKER_AVAILABLE=false
fi

# ====================================================================
# STEP 2: CONFIGURATION
# ====================================================================

print_header "STEP 2: Configuration"

# Prompt for configuration
read -p "Enter Supabase Project Reference (leave empty to skip): " SUPABASE_PROJECT_REF
read -p "Enter Supabase URL (leave empty to skip): " SUPABASE_URL
read -p "Enter Supabase Anon Key (leave empty to skip): " SUPABASE_ANON_KEY
read -p "Enter Supabase Service Role Key (leave empty to skip): " SUPABASE_SERVICE_ROLE_KEY

# Save configuration
if [ -n "$SUPABASE_PROJECT_REF" ]; then
    cat > .env.deployment << EOF
SUPABASE_PROJECT_REF=$SUPABASE_PROJECT_REF
SUPABASE_URL=$SUPABASE_URL
SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY
EOF
    print_success "Configuration saved to .env.deployment"
fi

# ====================================================================
# STEP 3: SUPABASE SETUP
# ====================================================================

print_header "STEP 3: Setting up Supabase"

if [ -z "$SUPABASE_PROJECT_REF" ]; then
    print_warning "Supabase project reference not provided. Skipping Supabase setup."
    print_info "To setup Supabase:"
    print_info "1. Create project at https://app.supabase.com"
    print_info "2. Run: supabase link --project-ref YOUR_PROJECT_REF"
    print_info "3. Run: supabase db push"
else
    print_info "Linking to Supabase project..."
    
    # Create supabase directory if it doesn't exist
    mkdir -p supabase/migrations
    
    # Copy migration files if they exist in the repo
    if [ -d "../supabase/migrations" ]; then
        cp -r ../supabase/migrations/* supabase/migrations/
        print_success "Migration files copied"
    fi
    
    # Link to Supabase project
    supabase link --project-ref "$SUPABASE_PROJECT_REF"
    print_success "Linked to Supabase project"
    
    # Push migrations
    print_info "Pushing database migrations..."
    supabase db push
    print_success "Database migrations applied"
    
    # Enable Realtime
    print_info "Configuring Realtime..."
    print_warning "Please enable Realtime manually in Supabase Dashboard:"
    print_info "Go to: Database > Replication"
    print_info "Enable for tables: markets, orders, trades, positions"
    
    # Configure Auth
    print_warning "Please configure Auth manually in Supabase Dashboard:"
    print_info "Go to: Authentication > Settings"
    print_info "1. Enable Email provider"
    print_info "2. Set Site URL to your Vercel domain"
fi

# ====================================================================
# STEP 4: FRONTEND SETUP
# ====================================================================

print_header "STEP 4: Setting up Frontend"

# Navigate to frontend directory
if [ -d "apps/web" ]; then
    cd apps/web
elif [ -d "../apps/web" ]; then
    cd ../apps/web
else
    print_error "Frontend directory not found"
    exit 1
fi

# Install dependencies
print_info "Installing dependencies..."
npm install
print_success "Dependencies installed"

# Create environment file
print_info "Creating environment file..."
cat > .env.local << EOF
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=$SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY=$SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY=$SUPABASE_SERVICE_ROLE_KEY

# App Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF
print_success "Environment file created"

# Build the application
print_info "Building application..."
npm run build
print_success "Application built successfully"

# ====================================================================
# STEP 5: VERCEL DEPLOYMENT
# ====================================================================

print_header "STEP 5: Deploying to Vercel"

read -p "Deploy to Vercel now? (y/n): " DEPLOY_VERCEL

if [ "$DEPLOY_VERCEL" = "y" ] || [ "$DEPLOY_VERCEL" = "Y" ]; then
    print_info "Logging in to Vercel..."
    vercel login
    
    print_info "Deploying to Vercel..."
    vercel --prod
    
    print_success "Deployed to Vercel!"
    print_warning "Don't forget to add environment variables in Vercel Dashboard:"
    print_info "1. Go to your project settings"
    print_info "2. Navigate to Environment Variables"
    print_info "3. Add the following:"
    print_info "   - NEXT_PUBLIC_SUPABASE_URL"
    print_info "   - NEXT_PUBLIC_SUPABASE_ANON_KEY"
    print_info "   - SUPABASE_SERVICE_ROLE_KEY"
else
    print_info "Skipping Vercel deployment"
    print_info "To deploy later, run: vercel --prod"
fi

# ====================================================================
# STEP 6: LOCAL DEVELOPMENT
# ====================================================================

print_header "STEP 6: Local Development Setup"

read -p "Start local development server? (y/n): " START_DEV

if [ "$START_DEV" = "y" ] || [ "$START_DEV" = "Y" ]; then
    print_success "Starting development server..."
    print_info "Access the app at: http://localhost:3000"
    npm run dev
else
    print_info "To start development server later, run: npm run dev"
fi

# ====================================================================
# STEP 7: N8N SETUP (OPTIONAL)
# ====================================================================

print_header "STEP 7: n8n Setup (Optional)"

if [ "$DOCKER_AVAILABLE" = true ]; then
    read -p "Deploy n8n automation? (y/n): " DEPLOY_N8N
    
    if [ "$DEPLOY_N8N" = "y" ] || [ "$DEPLOY_N8N" = "Y" ]; then
        cd ../../docker/n8n || cd ../../../docker/n8n
        
        print_info "Starting n8n with Docker Compose..."
        docker-compose up -d
        
        print_success "n8n deployed successfully!"
        print_info "Access n8n at: http://localhost:5678"
        print_info "Default credentials: admin / changeme123"
        print_warning "Change the default password immediately!"
    fi
else
    print_warning "Docker not available. Skipping n8n deployment."
    print_info "To deploy n8n later:"
    print_info "1. Install Docker"
    print_info "2. Run: cd docker/n8n && docker-compose up -d"
fi

# ====================================================================
# DEPLOYMENT SUMMARY
# ====================================================================

print_header "DEPLOYMENT SUMMARY"

echo -e "${GREEN}✓ Prerequisites checked${NC}"
echo -e "${GREEN}✓ Configuration saved${NC}"

if [ -n "$SUPABASE_PROJECT_REF" ]; then
    echo -e "${GREEN}✓ Supabase configured${NC}"
else
    echo -e "${YELLOW}⚠ Supabase setup skipped${NC}"
fi

echo -e "${GREEN}✓ Frontend built${NC}"

if [ "$DEPLOY_VERCEL" = "y" ] || [ "$DEPLOY_VERCEL" = "Y" ]; then
    echo -e "${GREEN}✓ Deployed to Vercel${NC}"
else
    echo -e "${YELLOW}⚠ Vercel deployment skipped${NC}"
fi

if [ "$DOCKER_AVAILABLE" = true ] && [ "$DEPLOY_N8N" = "y" ]; then
    echo -e "${GREEN}✓ n8n deployed${NC}"
else
    echo -e "${YELLOW}⚠ n8n deployment skipped${NC}"
fi

# ====================================================================
# NEXT STEPS
# ====================================================================

print_header "NEXT STEPS"

echo -e "${BLUE}1. Configure Supabase Auth:${NC}"
echo -e "   - Go to: https://app.supabase.com/project/$SUPABASE_PROJECT_REF/auth/settings"
echo -e "   - Add your Vercel domain to Site URL and Redirect URLs"
echo ""

echo -e "${BLUE}2. Enable Realtime:${NC}"
echo -e "   - Go to: https://app.supabase.com/project/$SUPABASE_PROJECT_REF/database/replication"
echo -e "   - Enable for: markets, orders, trades, positions"
echo ""

echo -e "${BLUE}3. Add Environment Variables in Vercel:${NC}"
echo -e "   - Go to your Vercel project settings"
echo -e "   - Add: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY"
echo ""

echo -e "${BLUE}4. Configure n8n Workflows (if deployed):${NC}"
echo -e "   - Access: http://localhost:5678"
echo -e "   - Import workflows from: docker/n8n/workflows/"
echo -e "   - Configure OpenAI API key for AI Oracle"
echo ""

echo -e "${BLUE}5. Test the Application:${NC}"
echo -e "   - Create a test user"
echo -e "   - Create a test market (admin)"
echo -e "   - Place test orders"
echo -e "   - Verify realtime updates"
echo ""

print_success "Deployment script completed!"
print_info "For detailed documentation, see:"
print_info "- PLOKYMARKET_COMPLETE_IMPLEMENTATION.md"
print_info "- API_REFERENCE.md"

# ====================================================================
# CREATE DEPLOYMENT CHECKLIST
# ====================================================================

cat > DEPLOYMENT_CHECKLIST.md << 'EOF'
# Plokymarket Deployment Checklist

## ✅ Pre-Deployment

- [ ] Node.js 18+ installed
- [ ] npm installed
- [ ] Git installed
- [ ] Supabase CLI installed
- [ ] Vercel CLI installed
- [ ] Docker installed (optional)

## ✅ Supabase Setup

- [ ] Supabase project created
- [ ] Database migrations applied
- [ ] Realtime enabled for: markets, orders, trades, positions
- [ ] Auth email provider enabled
- [ ] Site URL configured
- [ ] RLS policies verified
- [ ] Service role key secured

## ✅ Frontend Setup

- [ ] Dependencies installed
- [ ] Environment variables configured
- [ ] Build successful
- [ ] No TypeScript errors
- [ ] No ESLint errors

## ✅ Vercel Deployment

- [ ] Project deployed to Vercel
- [ ] Environment variables added
- [ ] Custom domain configured (optional)
- [ ] HTTPS enabled
- [ ] Build successful on Vercel

## ✅ Authentication Configuration

- [ ] Site URL updated in Supabase
- [ ] Redirect URLs configured
- [ ] Email templates customized
- [ ] Test user registration
- [ ] Test user login
- [ ] Test session persistence

## ✅ Database Verification

- [ ] All tables created
- [ ] Indexes created
- [ ] Functions deployed
- [ ] Triggers active
- [ ] Sample data inserted (optional)

## ✅ Trading Engine

- [ ] Match order function working
- [ ] Order placement tested
- [ ] Trade execution verified
- [ ] Position updates working
- [ ] Settlement logic verified

## ✅ Realtime Features

- [ ] Order book updates in realtime
- [ ] Trade notifications working
- [ ] Position updates instant
- [ ] Market price updates live

## ✅ Localization

- [ ] Bangla translations complete
- [ ] English translations complete
- [ ] Hindi translations complete
- [ ] Language switcher working
- [ ] Default language set

## ✅ Theme System

- [ ] Dark mode working
- [ ] Light mode working
- [ ] Theme toggle functional
- [ ] Colors consistent
- [ ] User preference saved

## ✅ n8n Automation (Optional)

- [ ] n8n deployed
- [ ] Workflows imported
- [ ] News scraper configured
- [ ] AI Oracle configured
- [ ] Payment verification setup

## ✅ Testing

- [ ] User registration works
- [ ] User login works
- [ ] Market creation works (admin)
- [ ] Order placement works
- [ ] Trade matching works
- [ ] Position updates work
- [ ] Wallet operations work
- [ ] Leaderboard displays
- [ ] Activity feed shows

## ✅ Security

- [ ] RLS enabled on all tables
- [ ] Service role key not exposed
- [ ] CORS configured
- [ ] Input validation implemented
- [ ] SQL injection prevented
- [ ] XSS prevention verified
- [ ] HTTPS enforced

## ✅ Performance

- [ ] Database indexes created
- [ ] Query optimization done
- [ ] Image optimization enabled
- [ ] Code splitting implemented
- [ ] Lazy loading used

## ✅ Monitoring

- [ ] Error logging configured
- [ ] Analytics setup (optional)
- [ ] Performance monitoring (optional)
- [ ] Uptime monitoring (optional)

## ✅ Documentation

- [ ] README updated
- [ ] API documentation complete
- [ ] Deployment guide available
- [ ] User guide created (optional)

## ✅ Production Ready

- [ ] All critical features working
- [ ] All tests passing
- [ ] No console errors
- [ ] Performance acceptable
- [ ] Security verified
- [ ] Backups configured

## 🎉 Launch!

- [ ] Final testing complete
- [ ] Announcement prepared
- [ ] Support channels ready
- [ ] Go live!
EOF

print_success "Deployment checklist created: DEPLOYMENT_CHECKLIST.md"

echo ""
echo -e "${GREEN}========================================${NC}"
echo -e "${GREEN}     DEPLOYMENT SCRIPT COMPLETE!       ${NC}"
echo -e "${GREEN}========================================${NC}"
echo ""
