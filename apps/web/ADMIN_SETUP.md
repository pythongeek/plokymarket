# Admin Dashboard Security Setup Guide

## 🔐 Secure Admin Access

This document explains how to securely set up and access the admin dashboard.

## Architecture

The admin dashboard uses a **multi-layer security approach**:

```
┌─────────────────────────────────────────────┐
│  1. MIDDLEWARE (Edge Protection)           │
│     - Checks auth on every admin request    │
│     - Redirects non-admins to login         │
├─────────────────────────────────────────────┤
│  2. API ROUTES (Server-Side Verification)  │
│     - Server validates admin status         │
│     - No trust in client-side code          │
├─────────────────────────────────────────────┤
│  3. DATABASE RLS (Row Level Security)      │
│     - Policies enforce admin access         │
│     - Data protected at database level      │
├─────────────────────────────────────────────┤
│  4. AUDIT LOGGING                          │
│     - All admin actions logged              │
│     - Access attempts tracked               │
└─────────────────────────────────────────────┘
```

## Setup Instructions

### Step 1: Run Security Migration

First, run the admin security setup migration in Supabase SQL Editor:

**File:** `supabase/migrations/056_admin_security_setup.sql`

This creates:
- `admin_access_log` table for audit trails
- Security functions (`promote_to_admin`, `revoke_admin_access`)
- Admin activity monitoring views

### Step 2: Create Initial Admin User

#### Option A: Via Supabase SQL Editor (Recommended for first admin)

```sql
-- Replace with your actual email
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Get your user ID from auth.users
    SELECT id INTO v_user_id 
    FROM auth.users 
    WHERE email = 'your-email@example.com';
    
    -- Insert or update user_profiles
    INSERT INTO user_profiles (id, full_name, email, is_admin, admin_notes)
    SELECT 
        id, 
        COALESCE(raw_user_meta_data->>'full_name', email),
        email, 
        TRUE,
        'Initial admin setup at ' || NOW()
    FROM auth.users 
    WHERE id = v_user_id
    ON CONFLICT (id) 
    DO UPDATE SET 
        is_admin = TRUE,
        admin_notes = COALESCE(user_profiles.admin_notes, '') || 
                      E'\nPromoted to admin at ' || NOW();
    
    -- Log the setup
    PERFORM log_admin_access(v_user_id, 'initial_setup', TRUE);
    
    RAISE NOTICE 'Admin setup complete for user: %', v_user_id;
END $$;
```

#### Option B: Via API (For existing admins only)

```sql
-- Existing admin can promote another user
SELECT promote_to_admin(
    'new-user-uuid-here',      -- User to promote
    'your-admin-uuid-here',    -- Your admin UUID
    'Added as admin for operations'  -- Reason
);
```

### Step 3: Verify Admin Access

```sql
-- Check if you're an admin
SELECT * FROM admin_activity_summary;

-- View your admin access logs
SELECT * FROM admin_access_log 
WHERE admin_id = 'your-uuid' 
ORDER BY created_at DESC 
LIMIT 10;
```

## Accessing the Admin Dashboard

### 1. Login as Admin

1. Go to: `https://polymarket-bangladesh.vercel.app/login`
2. Login with your admin email/password
3. Navigate to: `https://polymarket-bangladesh.vercel.app/admin`

### 2. Direct Access URL

```
https://polymarket-bangladesh.vercel.app/admin
```

If you're not logged in or not an admin, you'll be redirected to:
- `/login?redirect=admin` - If not logged in
- `/markets` - If logged in but not an admin

### 3. API Verification

You can verify admin status via API:

```bash
curl -X GET \
  https://polymarket-bangladesh.vercel.app/api/admin/verify \
  -H "Cookie: your-auth-cookie"
```

Response if admin:
```json
{
  "isAdmin": true,
  "isSeniorCounsel": false,
  "fullName": "Admin Name",
  "email": "admin@example.com"
}
```

## Admin Features

### Market Management
- Create new markets with guided workflow
- Resolve markets (set outcomes)
- View market analytics

### User Management  
- View all users with filters
- Manage KYC verifications
- Suspend/ban users
- View user trading history
- Perform position interventions

### Support & Audit
- View support tickets
- Internal notes on users
- Complete audit trail of all admin actions
- Dual authorization for critical actions

## Security Best Practices

### 1. Admin Access

```sql
-- Limit number of admins
SELECT COUNT(*) FROM user_profiles WHERE is_admin = TRUE;

-- Should be <= 5 for security
```

### 2. Monitor Admin Activity

```sql
-- Check recent admin logins
SELECT * FROM admin_access_log 
WHERE action = 'login' 
AND created_at > NOW() - INTERVAL '24 hours'
ORDER BY created_at DESC;

-- Check failed access attempts
SELECT * FROM admin_access_log 
WHERE success = FALSE 
AND created_at > NOW() - INTERVAL '7 days';
```

### 3. Revoke Access When Needed

```sql
-- Revoke admin access
SELECT revoke_admin_access(
    'user-uuid-to-revoke',
    'your-admin-uuid',
    'No longer needs admin access'
);
```

### 4. Senior Counsel Designation

For legal review access, grant `is_senior_counsel`:

```sql
UPDATE user_profiles 
SET is_senior_counsel = TRUE 
WHERE id = 'legal-team-user-uuid';
```

## Troubleshooting

### "Access Denied" when accessing /admin

1. Check if you're logged in
2. Verify admin status:
   ```sql
   SELECT is_admin FROM user_profiles WHERE email = 'your-email';
   ```
3. Check for access denials:
   ```sql
   SELECT * FROM admin_access_log 
   WHERE admin_id = 'your-uuid' 
   AND success = FALSE;
   ```

### "user_profiles does not exist" error

Run migration `055_comprehensive_fix.sql` first, then `056_admin_security_setup.sql`.

### Database connection issues

Ensure your `.env.local` has correct Supabase credentials:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

## Security Checklist

- [ ] Initial admin created via SQL (not hardcoded)
- [ ] Admin access logged in `admin_access_log`
- [ ] Number of admins limited (≤5 recommended)
- [ ] 2FA enabled in Supabase for admin accounts
- [ ] Regular review of `admin_audit_log`
- [ ] Sensitive operations require dual authorization
- [ ] No admin credentials in frontend code
- [ ] RLS policies active on all admin tables

## Emergency Contacts

If admin access is compromised:
1. Revoke access immediately: `SELECT revoke_admin_access(...)`
2. Check logs: `SELECT * FROM admin_access_log WHERE success = FALSE`
3. Reset passwords in Supabase Auth dashboard
4. Review all recent admin actions in `admin_audit_log`
