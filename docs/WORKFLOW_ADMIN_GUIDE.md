# QStash Workflow Management - Admin Guide
## Production Ready Features

**Last Updated:** February 16, 2026  
**Status:** ✅ Production Deployed  
**URL:** https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/workflows

---

## 📋 Overview

This guide covers the QStash workflow management system for administrators. All features are production-ready and accessible through the secure admin panel.

---

## 🔐 Admin Access Requirements

### Authentication
- **Login URL:** https://polymarket-bangladesh.vercel.app/auth-portal-3m5n8
- **Required Role:** `is_admin = true` OR `is_super_admin = true` in `user_profiles` table
- **Alternative:** `role = 'admin'` in `users` table (legacy support)

### Access Control Levels

| Feature | Admin | Super Admin |
|---------|-------|-------------|
| View Workflows | ✅ | ✅ |
| Deploy Workflows | ✅ | ✅ |
| Delete Workflows | ✅ | ✅ |
| View Schedules | ✅ | ✅ |
| API Access | ✅ | ✅ |

---

## 🚀 How to Access Workflow Management

### Method 1: Through Admin Dashboard
1. Login to admin panel: https://polymarket-bangladesh.vercel.app/auth-portal-3m5n8
2. Navigate to: **System Control Dashboard** (`/sys-cmd-7x9k2`)
3. Click on **"Workflows"** card in System Health section
4. Or click **"ওয়ার্কফ্লো"** in the left sidebar

### Method 2: Direct URL
- **Production:** https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/workflows
- **Preview:** https://polymarket-bangladesh-cvhnxgun2-bdowneer191s-projects.vercel.app/sys-cmd-7x9k2/workflows

---

## 📊 Available Workflows

### 1. Tick Adjustment (`tick-adjustment`)
- **Purpose:** Adjusts market tick sizes based on volatility
- **Frequency:** Hourly (`0 * * * *`)
- **Endpoint:** `/api/cron/tick-adjustment`
- **Method:** GET
- **Status:** ✅ Deployed (Schedule ID: `scd_7HA1v8V2fS4cruzpnbVtsk3aAGVa`)

**What it does:**
- Calculates 24h realized volatility for active markets
- Suggests adaptive tick sizes
- Applies pending tick changes after 24h notice
- Handles emergency widening for high volatility

### 2. Leaderboard Processing (`leaderboard`)
- **Purpose:** Processes weekly leagues and rankings
- **Frequency:** Daily at 6 AM BDT (`0 0 * * *`)
- **Endpoint:** `/api/leaderboard/cron`
- **Method:** POST
- **Status:** ✅ Deployed (Schedule ID: `scd_7JeKzknUvoYwnrVV2LRcBtVJxyc2`)

**What it does:**
- Updates leaderboard cache
- Processes weekly league promotions/demotions
- Calculates user metrics (ROI, streaks)

### 3. Batch Markets (`batch-markets`)
- **Purpose:** Batch processes markets ready for resolution
- **Frequency:** Every 15 minutes (`0,15,30,45 * * * *`)
- **Endpoint:** `/api/cron/batch-markets`
- **Method:** GET
- **Status:** ✅ Deployed (Schedule ID: `scd_6V1wkn8SBSUZU83yBKuxarRnrhP9`)

**What it does:**
- Finds markets ready for resolution
- Closes active markets past trading end date
- Triggers Upstash Workflow for AI processing

### 4. Check Markets (`check-markets`)
- **Purpose:** Hourly market resolution checks
- **Frequency:** Hourly (`0 * * * *`)
- **Endpoint:** `/api/cron/check-markets`
- **Method:** GET
- **Status:** Available for deployment

### 5. Daily AI Topics (`daily-ai-topics`)
- **Purpose:** Generates AI-suggested market topics
- **Frequency:** Daily at 6 AM BDT (`0 0 * * *`)
- **Endpoint:** `/api/cron/daily-ai-topics`
- **Method:** POST
- **Status:** Available for deployment

---

## 🎛️ Using the Workflow Manager UI

### Deploy a New Workflow
1. Navigate to `/sys-cmd-7x9k2/workflows`
2. Find the workflow in "Available Workflows" section
3. Click **"Deploy"** button
4. Confirm in the dialog
5. Workflow will be created in QStash

### View Active Schedules
1. Scroll to "Active Schedules" section
2. See all deployed schedules with:
   - Schedule ID
   - Destination URL
   - Cron expression
   - Status (Active/Paused)

### Delete a Schedule
1. Find the schedule in "Active Schedules"
2. Click the **trash icon** (🗑️)
3. Confirm deletion
4. Schedule will be removed from QStash

---

## 🔌 API Reference

### Authentication
All API endpoints require Bearer token authentication:
```bash
Authorization: Bearer <supabase_session_token>
```

### Endpoints

#### 1. List All Schedules
```bash
GET /api/admin/qstash/setup
```

**Response:**
```json
{
  "success": true,
  "schedules": [
    {
      "scheduleId": "scd_xxx",
      "cron": "0 * * * *",
      "destination": "https://.../api/cron/tick-adjustment",
      "createdAt": 1771183416953,
      "isPaused": false
    }
  ],
  "availableWorkflows": {
    "tick-adjustment": {
      "path": "/api/cron/tick-adjustment",
      "cron": "0 * * * *",
      "method": "GET",
      "description": "Hourly tick size adjustments"
    }
  }
}
```

#### 2. Deploy a Workflow
```bash
POST /api/admin/qstash/setup
Content-Type: application/json

{
  "workflow": "tick-adjustment"
}
```

**Available workflows:**
- `tick-adjustment`
- `leaderboard`
- `batch-markets`
- `check-markets`
- `daily-ai-topics`

**Response:**
```json
{
  "success": true,
  "scheduleId": "scd_xxx",
  "workflow": "tick-adjustment",
  "cron": "0 * * * *",
  "webhookUrl": "https://.../api/cron/tick-adjustment",
  "description": "Hourly tick size adjustments",
  "message": "QStash schedule for tick-adjustment created successfully"
}
```

#### 3. Delete a Schedule
```bash
DELETE /api/admin/qstash/setup?scheduleId=scd_xxx
```

**Response:**
```json
{
  "success": true,
  "message": "Schedule scd_xxx deleted successfully"
}
```

---

## 🛡️ Security Features

### 1. Authentication
- JWT token validation via Supabase
- Session-based authentication
- Automatic token refresh

### 2. Authorization
- Admin role verification (`is_admin` or `is_super_admin`)
- Fallback to legacy `role = 'admin'`
- 401 Unauthorized for non-admins

### 3. API Protection
- QStash signature verification on cron endpoints
- Development mode bypass available
- Production requires valid signatures

### 4. Audit Logging
All admin actions are logged to `admin_audit_log` table:
- Action type
- Admin user ID
- Resource affected
- Timestamp
- IP address (optional)

---

## 📁 File Structure

```
apps/web/src/
├── app/
│   ├── api/
│   │   ├── admin/
│   │   │   └── qstash/
│   │   │       └── setup/
│   │   │           └── route.ts      # Admin API for workflow management
│   │   ├── cron/
│   │   │   ├── tick-adjustment/
│   │   │   │   └── route.ts          # Tick adjustment cron job
│   │   │   └── batch-markets/
│   │   │       └── route.ts          # Batch markets cron job
│   │   └── leaderboard/
│   │       └── cron/
│   │           └── route.ts          # Leaderboard cron job
│   └── sys-cmd-7x9k2/
│       ├── page.tsx                   # Admin dashboard with Workflows card
│       └── workflows/
│           └── page.tsx               # Dedicated workflows management page
├── components/
│   └── admin/
│       ├── QStashWorkflowManager.tsx  # Main workflow UI component
│       └── SecureAdminLayout.tsx      # Admin layout with navigation
├── hooks/
│   └── useQStashWorkflows.ts          # React hook for workflow management
└── lib/
    └── qstash/
        ├── client.ts                  # QStash API client
        └── verify.ts                  # Signature verification utility
```

---

## 🔧 Environment Variables Required

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# QStash
QSTASH_TOKEN=your-qstash-token
QSTASH_CURRENT_SIGNING_KEY=your-signing-key
QSTASH_NEXT_SIGNING_KEY=your-next-signing-key

# App URL
NEXT_PUBLIC_APP_URL=https://polymarket-bangladesh.vercel.app
```

---

## 🐛 Troubleshooting

### "Unauthorized" Error
- Check if you're logged in as admin
- Verify `is_admin = true` in `user_profiles` table
- Try refreshing the page

### Workflow Deployment Fails
- Check QStash token is valid
- Verify `QSTASH_TOKEN` environment variable
- Check Upstash console for limits

### Schedules Not Showing
- Check network connection
- Verify QStash API is accessible
- Check browser console for errors

### Cron Jobs Not Running
- Verify schedule is not paused in Upstash console
- Check Vercel function logs
- Ensure QStash signature verification passes

---

## 📞 Support

- **Admin Panel:** https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2
- **Workflows Page:** https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/workflows
- **Upstash Console:** https://console.upstash.com/qstash/schedules
- **Vercel Dashboard:** https://vercel.com/dashboard

---

## ✅ Production Checklist

| Feature | Status | Notes |
|---------|--------|-------|
| Admin Authentication | ✅ | JWT + Role verification |
| API Security | ✅ | QStash signature verification |
| Frontend UI | ✅ | Responsive, dark mode support |
| Error Handling | ✅ | Toast notifications, error boundaries |
| Type Safety | ✅ | Full TypeScript coverage |
| Database Integration | ✅ | Supabase RLS policies |
| Audit Logging | ✅ | All actions logged |
| Documentation | ✅ | This guide |
| Deployment | ✅ | Vercel production |
| QStash Schedules | ✅ | 3 active, 2 ready |

---

**End of Guide**
