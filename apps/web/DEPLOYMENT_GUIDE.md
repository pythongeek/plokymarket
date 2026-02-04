# Deployment Guide for Polymarket BD

## Prerequisites

1. **Node.js 18+** installed
2. **Vercel CLI** or GitHub account
3. **Supabase Account** with a project created

## Step 1: Set Up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. Note your project credentials from Settings > API:
   - Project URL
   - anon public key
   - service_role secret key

## Step 2: Configure Environment Variables

### Option A: Vercel Dashboard (Recommended)

1. Go to your Vercel dashboard
2. Import your GitHub repository
3. In **Settings > Environment Variables**, add:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### Option B: Local .env.local

Edit `apps/web/.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

## Step 3: Set Up Supabase Database

Run the SQL commands from `supabase/db/init.sql` in your Supabase SQL Editor to create the required tables.

## Step 4: Deploy to Vercel

### Option A: Git Push (Recommended)

```bash
# Navigate to project
cd apps/web

# Initialize git if not already done
git init
git add .
git commit -m "Initial commit"

# Push to GitHub
git remote add origin https://github.com/your-username/your-repo.git
git push -u origin main

# Connect to Vercel
# 1. Go to vercel.com
# 2. Import your GitHub repository
# 3. Deploy!
```

### Option B: Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login to Vercel
vercel login

# Deploy
cd apps/web
vercel --prod
```

## Step 5: Configure Supabase Auth Redirects

In your Supabase dashboard, go to **Authentication > URL Configuration**:

- **Site URL**: `https://your-app.vercel.app`
- **Redirect URLs**: Add `https://your-app.vercel.app/auth/callback`

## Step 6: Enable Realtime

In Supabase dashboard, enable Realtime for:
- `orders` table
- `trades` table
- `markets` table

## Step 7: Test the Deployment

1. Visit your deployed app
2. Try browsing markets
3. Register a new account
4. Test login/logout

## Troubleshooting

### Build Fails

```bash
# Test build locally
cd apps/web
npm run build
```

### Environment Variables Not Working

- Ensure variables are set in Vercel dashboard
- Variable names must start with `NEXT_PUBLIC_`
- Redeploy after adding new variables

### Supabase Connection Issues

- Verify project URL and anon key
- Check Supabase project is active
- Ensure tables are created in database

## Production Checklist

- [ ] Supabase project created
- [ ] Database tables created
- [ ] Auth redirects configured
- [ ] Environment variables set in Vercel
- [ ] Realtime enabled for tables
- [ ] Custom domain configured (optional)
- [ ] SSL certificate active

## Useful Commands

```bash
# Development
cd apps/web
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Lint
npm run lint
```

## Support

For issues with:
- **Vercel**: Visit [vercel.com/support](https://vercel.com/support)
- **Supabase**: Visit [supabase.com/support](https://supabase.com/support)
- **App Issues**: Check browser console for errors
