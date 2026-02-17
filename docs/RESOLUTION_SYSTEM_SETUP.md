# Plokymarket Resolution System - Production Setup Guide

## Overview

This guide covers the complete setup of the AI-powered market resolution system for Plokymarket. The system uses a hybrid approach combining AI oracle, manual admin review, and expert panels.

## Architecture

```
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Upstash       │────▶│  Vercel      │────▶│   n8n Workflow  │
│   QStash        │     │  Edge Func   │     │   (AI Oracle)   │
│   (Cron Job)    │     │  /api/cron   │     │                 │
└─────────────────┘     └──────────────┘     └─────────────────┘
                                                        │
                                                        ▼
┌─────────────────┐     ┌──────────────┐     ┌─────────────────┐
│   Admin Panel   │◀────│  Supabase    │◀────│  Webhook        │
│   (Manual)      │     │  Database    │     │  /api/webhooks  │
└─────────────────┘     └──────────────┘     └─────────────────┘
```

## Components

### 1. Database Schema

The `resolution_systems` table is already created via migration `082_market_resolution_system.sql`.

Key fields:
- `event_id`: Links to markets table
- `primary_method`: AI oracle, manual admin, expert panel, dispute tribunal
- `resolution_status`: pending, in_progress, resolved, disputed, failed
- `confidence_level`: AI confidence score (0-100)
- `evidence`: JSON array of resolution evidence

### 2. Vercel Edge Functions

#### `/api/cron/check-markets`
- Triggered by QStash every hour
- Finds markets past `trading_closes_at`
- Creates resolution records
- Triggers n8n workflow

#### `/api/webhooks/n8n/resolution`
- Receives AI analysis results
- Auto-resolves if confidence > 90%
- Updates market status
- Triggers settlement

### 3. Admin Panel

Access at: `/admin/resolutions`

Features:
- View pending/in-progress/disputed resolutions
- Review AI analysis and sources
- Manual resolve with reasoning
- Real-time updates via Supabase subscriptions

## Environment Variables

Add these to your Vercel project:

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# QStash (Upstash)
QSTASH_TOKEN=eyJVc2VySUQiOiIyN2ZiNDY4Yi01ZWYxLTQzNGUtYmUyMi1hNmJlNDgwOWZmNDkiLCJQYXNzd29yZCI6ImRkMzVjYjc5NDg1ODQ2NTM4ZGZiZDViZTg3OGNmOGUwIn0=
QSTASH_CURRENT_SIGNING_KEY=sig_6uNKneQ6CmH9zqfpFfyJKxpBgQLH
QSTASH_NEXT_SIGNING_KEY=sig_7sB1LAkcv2c9LCGHAypXWwZ9F8Ar
QSTASH_URL=https://qstash.upstash.io

# n8n
N8N_RESOLUTION_WEBHOOK_URL=https://your-n8n-instance.com/webhook/plokymarket-resolution
N8N_API_KEY=your-n8n-api-key

# App
NEXT_PUBLIC_APP_URL=https://plokymarket.vercel.app
```

## Setup Steps

### Step 1: Deploy Database Migration

The migration `082_market_resolution_system.sql` should already be applied. Verify:

```sql
SELECT * FROM resolution_systems LIMIT 1;
```

### Step 2: Deploy Vercel Functions

Push your code to deploy the edge functions:

```bash
git add .
git commit -m "Add resolution system"
git push
```

### Step 3: Setup QStash Schedule

Option A: Using the setup script

```bash
cd apps/web
node scripts/setup-qstash.js
```

Option B: Using the admin API

```bash
curl -X POST https://plokymarket.vercel.app/api/admin/qstash/setup \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"cron": "0 * * * *"}'
```

Option C: Manual QStash Dashboard

1. Go to [Upstash Console](https://console.upstash.com)
2. Navigate to QStash
3. Create Schedule:
   - URL: `https://plokymarket.vercel.app/api/cron/check-markets`
   - Cron: `0 * * * *` (every hour)
   - Retries: 3

### Step 4: Setup n8n Workflow

1. **Install n8n** (if self-hosted):
   ```bash
   docker run -it --rm \
     --name n8n \
     -p 5678:5678 \
     -v ~/.n8n:/home/node/.n8n \
     n8nio/n8n
   ```

2. **Import the workflow**:
   - Open n8n dashboard
   - Go to Workflows → Import
   - Upload `automation/workflows/ai_oracle_resolution.json`

3. **Configure credentials**:
   - Gemini API Key (Google AI)
   - Google Search API Key + CX
   - News API Key

4. **Set environment variables in n8n**:
   ```
   PLOKYMARKET_WEBHOOK_URL=https://plokymarket.vercel.app
   N8N_API_KEY=your-secret-key
   ```

5. **Activate the workflow**

### Step 5: Test the System

1. **Test cron endpoint**:
   ```bash
   curl https://plokymarket.vercel.app/api/cron/check-markets \
     -H "upstash-signature: test"
   ```

2. **Test n8n webhook**:
   ```bash
   curl -X POST https://plokymarket.vercel.app/api/webhooks/n8n/resolution \
     -H "Content-Type: application/json" \
     -H "X-N8N-API-KEY: your-key" \
     -d '{
       "market_id": "test-market-id",
       "question": "Will it rain tomorrow?",
       "outcome": "YES",
       "confidence_score": 95,
       "reasoning": "Weather forecast shows 90% chance of rain",
       "sources": [{"url": "https://example.com", "title": "Weather Report"}],
       "timestamp": "2024-01-01T00:00:00Z"
     }'
   ```

3. **Create a test market** and let it close

4. **Monitor logs** in Vercel dashboard

## Resolution Workflow

### Automatic Resolution (High Confidence)

```
Market Closes
    ↓
QStash triggers /api/cron/check-markets
    ↓
Resolution record created (status: pending)
    ↓
n8n workflow triggered
    ↓
AI searches sources (Google, News API)
    ↓
Gemini analyzes and returns outcome + confidence
    ↓
If confidence >= 90%:
    ↓
Market auto-resolved
    ↓
Settlement triggered
    ↓
Users receive payouts
```

### Manual Review (Low Confidence)

```
AI returns confidence < 90%
    ↓
Resolution status: pending (manual review)
    ↓
Admin notified
    ↓
Admin reviews AI analysis in /admin/resolutions
    ↓
Admin decides: YES / NO
    ↓
Market resolved manually
    ↓
Settlement triggered
```

## Security Considerations

1. **QStash Signature Verification**: All cron endpoints verify QStash signatures
2. **n8n API Key**: Webhook endpoints require valid API key
3. **Admin Authentication**: Admin panel requires admin role
4. **RLS Policies**: Database has Row Level Security enabled
5. **Service Role Key**: Only used server-side in edge functions

## Monitoring & Debugging

### Vercel Logs

Check function logs in Vercel dashboard:
- `/api/cron/check-markets`
- `/api/webhooks/n8n/resolution`

### QStash Logs

View in Upstash Console:
- Delivery attempts
- Failed deliveries
- Retry history

### n8n Executions

Monitor in n8n dashboard:
- Successful executions
- Failed nodes
- Execution time

### Database Queries

```sql
-- Check pending resolutions
SELECT * FROM resolution_systems 
WHERE resolution_status = 'pending';

-- Check recent auto-resolutions
SELECT * FROM resolution_systems 
WHERE resolution_status = 'resolved' 
  AND primary_method = 'ai_oracle'
ORDER BY resolved_at DESC;

-- Check markets needing attention
SELECT m.question, m.status, r.resolution_status, r.confidence_level
FROM markets m
LEFT JOIN resolution_systems r ON m.id = r.event_id
WHERE m.status IN ('closed', 'active')
  AND m.trading_closes_at < NOW();
```

## Troubleshooting

### Cron job not triggering

1. Check QStash schedule exists:
   ```bash
   curl -H "Authorization: Bearer $QSTASH_TOKEN" \
     https://qstash.upstash.io/v2/schedules
   ```

2. Verify environment variables in Vercel

3. Check function logs for errors

### n8n workflow not receiving requests

1. Verify webhook URL is correct
2. Check n8n workflow is active
3. Test webhook manually
4. Check n8n logs

### AI not auto-resolving

1. Check confidence threshold (default: 90%)
2. Verify Gemini API key
3. Check sources are returning results
4. Review evidence JSON in database

### Settlement not working

1. Verify `settle_market` RPC function exists
2. Check wallet balances
3. Review transaction logs

## Cost Optimization (Vercel Free Tier)

- **Edge Functions**: Use edge runtime (no cold starts, lower cost)
- **QStash**: 100 free requests/day on free tier
- **Cron Frequency**: Default is hourly, adjust based on needs
- **n8n**: Self-host to avoid n8n cloud costs

## Support

For issues or questions:
1. Check logs in Vercel, QStash, and n8n
2. Review this documentation
3. Check the database for error states
4. Contact the development team

## Future Enhancements

- [ ] Expert panel voting system
- [ ] Dispute tribunal workflow
- [ ] External oracle integrations
- [ ] Multi-language AI analysis
- [ ] Confidence threshold per market
- [ ] Appeal mechanism for users
