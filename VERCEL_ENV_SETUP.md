# Vercel Environment Variables Setup Guide

## ✅ Checking Current Environment Variables on Vercel

### Method 1: Using Vercel CLI (Recommended)

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm i -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Check current environment variables**:
   ```bash
   # Navigate to your project directory
   cd apps/web
   
   # List all environment variables
   vercel env ls
   
   # Or check for specific variables
   vercel env ls | findstr SUPABASE
   ```

### Method 2: Using Vercel Dashboard

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Click on your project: `polymarket-bangladesh`
3. Go to **Settings** tab
4. Click **Environment Variables** in the left sidebar
5. You'll see all currently configured variables

## 🔧 Required Environment Variables for Production

Based on your `.env.local` file, you need to add these variables to Vercel:

### Required Variables

| Variable Name | Value (from your .env.local) | Required For |
|---------------|------------------------------|--------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://sltcfmqefujecqfbmkvz.supabase.co` | Database connection |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE` | Authentication |
| `GEMINI_API_KEY` | `AIzaSyC9f91wzmjIklpDRQBQJ4-g0Uxmc6IiZCg` | AI Oracle (optional) |

### How to Add Environment Variables on Vercel

#### Option A: Using Vercel CLI

```bash
# Navigate to your project
cd apps/web

# Add each variable (Production environment)
vercel env add NEXT_PUBLIC_SUPABASE_URL production
# Enter value: https://sltcfmqefujecqfbmkvz.supabase.co

vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY production
# Enter value: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE

# Add to Preview environment as well
vercel env add NEXT_PUBLIC_SUPABASE_URL preview
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY preview

# Add to Development environment
vercel env add NEXT_PUBLIC_SUPABASE_URL development
vercel env add NEXT_PUBLIC_SUPABASE_ANON_KEY development
```

#### Option B: Using Vercel Dashboard (Easier)

1. Go to [vercel.com/dashboard](https://vercel.com/dashboard)
2. Select your project: `polymarket-bangladesh`
3. Click **Settings** → **Environment Variables**
4. Click **Add** button for each variable:

   **First Variable:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: `https://sltcfmqefujecqfbmkvz.supabase.co`
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

   **Second Variable:**
   - **Name**: `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - **Value**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE`
   - **Environment**: ✅ Production, ✅ Preview, ✅ Development
   - Click **Save**

5. **Redeploy** your project:
   - Go to **Deployments** tab
   - Click the latest deployment
   - Click **Redeploy** button

## 🗄️ Populating Leaderboard Mock Data

After setting up environment variables, populate the database with realistic mock data:

### Method 1: Using Supabase Dashboard (Recommended)

1. Go to [app.supabase.com](https://app.supabase.com)
2. Select your project
3. Go to **SQL Editor** in the left sidebar
4. Click **New Query**
5. Open the file: `supabase/migrations/029_leaderboard_mock_data.sql`
6. Copy the entire SQL content
7. Paste into the SQL Editor
8. Click **Run**

### Method 2: Using psql CLI

```bash
# Set your database connection string
export DATABASE_URL="postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres"

# Execute the SQL file
psql "$DATABASE_URL" -f supabase/migrations/029_leaderboard_mock_data.sql
```

### Method 3: Using Node.js Script

```bash
# Install dependencies
cd apps/web
npm install

# Run the populate script
node ../../scripts/populate-leaderboard-data.js
```

## ✅ Verification Checklist

After setup, verify everything is working:

### 1. Check Environment Variables
```bash
vercel env ls
```

### 2. Test the Live Site
- Visit: https://polymarket-bangladesh.vercel.app/leaderboard
- You should see:
  - [ ] 50+ traders in the leaderboard
  - [ ] Different leagues (Bronze, Silver, Gold, Platinum, Diamond)
  - [ ] Various badges displayed
  - [ ] P&L rankings working
  - [ ] Volume rankings working
  - [ ] ROI percentages showing

### 3. Verify Database Tables
Run this SQL in Supabase SQL Editor:
```sql
-- Check user count
SELECT COUNT(*) as total_users FROM users;

-- Check positions
SELECT COUNT(*) as total_positions FROM positions;

-- Check leaderboard cache
SELECT timeframe, COUNT(*) as entries 
FROM leaderboard_cache 
GROUP BY timeframe;

-- Check leagues
SELECT l.name, COUNT(ul.user_id) as user_count
FROM leagues l
LEFT JOIN user_leagues ul ON l.id = ul.league_id
GROUP BY l.id, l.name;

-- Check badges
SELECT b.name, COUNT(ub.user_id) as awarded_count
FROM badges b
LEFT JOIN user_badges ub ON b.id = ub.badge_id
GROUP BY b.id, b.name;
```

## 🚨 Troubleshooting

### Issue: "Environment variable not found" error
**Solution**: Make sure you added the variables to the correct environment (Production/Preview/Development)

### Issue: Leaderboard shows empty
**Solution**: 
1. Check if migrations ran successfully
2. Verify `leaderboard_cache` table has data
3. Check browser console for API errors

### Issue: Database connection failed
**Solution**:
1. Verify `NEXT_PUBLIC_SUPABASE_URL` is correct
2. Check if anon key has required permissions
3. Ensure RLS policies are configured correctly

## 📞 Support

If you encounter issues:
1. Check Vercel logs: Dashboard → Deployments → Latest → Functions
2. Check Supabase logs: Dashboard → Logs
3. Verify all migrations are applied in order
