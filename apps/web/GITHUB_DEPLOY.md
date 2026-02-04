# GitHub & Vercel Deployment

## Step 1: Create GitHub Repository

1. Go to https://github.com/new
2. Repository name: `plokymarket`
3. Make it **Public** or **Private**
4. **DO NOT** check "Add a README file" (we have files already)
5. Click "Create repository"

## Step 2: Push Code to GitHub

Run these commands in your terminal (PowerShell or CMD):

```bash
cd f:/My profession/Hybrid APPs/Plokymarket

# Initialize git (if not already done)
git init

# Add all files
git add .

# Commit files
git commit -m "Initial commit - Polymarket BD"

# Add GitHub remote (replace YOUR_USERNAME with your actual username)
git remote add origin https://github.com/YOUR_USERNAME/plokymarket.git

# Push to GitHub
git push -u origin main
```

**Important:** Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Connect to Vercel

1. Go to https://vercel.com
2. Sign in with GitHub
3. Click "Add New Project"
4. Select the `plokymarket` repository
5. Framework Preset: **Next.js**
6. Root Directory: `apps/web`
7. Click "Deploy"

## Step 4: Add Environment Variables in Vercel

After deployment, go to:
1. Project Settings → Environment Variables
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

3. Click "Redeploy" to apply changes

## Step 5: Test Your Deployment

Visit the URL provided by Vercel (e.g., https://plokymarket.vercel.app)

## Quick Commands Summary

```bash
cd f:/My profession/Hybrid APPs/Plokymarket
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/plokymarket.git
git push -u origin main
```

Then import in Vercel dashboard!

## Troubleshooting

### "fatal: remote origin already exists"
```bash
git remote remove origin
git remote add origin https://github.com/YOUR_USERNAME/plokymarket.git
```

### Push rejected
```bash
git pull origin main --allow-unrelated-histories
# Resolve any conflicts
git add .
git commit -m "Merge"
git push
```

### Authentication failed
Make sure you're logged into GitHub in your terminal or use a Personal Access Token as password.
