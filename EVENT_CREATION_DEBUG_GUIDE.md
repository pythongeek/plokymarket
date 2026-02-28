# Event Creation Debug Guide

## 🔴 Current Status: Still Not Working

After applying Migration 133 and redeploying Vercel, event creation is **still failing silently**.

---

## 📋 What We Know

| Test | Result |
|------|--------|
| Admin Login | ✅ Works |
| Event Form Submission | ✅ Form data collected |
| "Create Event" Button | ✅ Changes to "Creating..." |
| Console Errors | ❌ None visible |
| Events Created | ❌ 0 |
| Markets Created | ❌ 0 |

**Key Observation:** The button stays on "Creating..." indefinitely, suggesting the API call is either:
1. Timing out
2. Returning an error that's not being displayed
3. Hanging on the database side

---

## 🚀 Next Steps

### Step 1: Apply Migration 134 (Debug Functions)

Run this SQL in your Supabase SQL Editor:

```sql
-- Apply the debug migration
\i supabase/migrations/134_debug_event_creation.sql
```

Or copy/paste the contents of:
`supabase/migrations/134_debug_event_creation.sql`

### Step 2: Run Diagnostic Queries

After applying Migration 134, run these in Supabase SQL Editor:

#### Test 1: Basic Event Insertion
```sql
SELECT test_event_creation();
```
**Expected:** `{"success": true, "message": "Event insertion works correctly"}`

#### Test 2: Check create_event_complete
```sql
SELECT create_event_complete(
    '{"title": "Test Event", "question": "Test?", "trading_closes_at": "2026-03-15T18:00:00Z"}'::jsonb,
    (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
);
```
**Expected:** Should return success with event_id and market_id

#### Test 3: Try the Debug Function
```sql
SELECT create_event_debug(
    '{"title": "Debug Test", "question": "Debug?", "category": "sports"}'::jsonb,
    (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
);
```

### Step 3: Run the Node.js Debug Script

```bash
cd "f:\My profession\Hybrid APPs\Plokymarket"

# Set your credentials
set NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Run the debug script
node debug_event_creation.js
```

This will output diagnostic information about:
- Basic event insertion
- Function existence
- Admin user detection
- Direct function calls

### Step 4: Check Supabase Logs

1. Go to [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to **Logs** → **Postgres**
4. Look for errors when you try to create an event
5. Filter by: `create_event` or look for `ERROR` entries

---

## 🔍 Likely Causes

Based on the symptoms (silent failure, no console errors), the issue is likely:

### Cause 1: Function Not Updated
The `create_event_complete` function might not have been updated with the new code.

**Check:**
```sql
SELECT prosrc 
FROM pg_proc 
WHERE proname = 'create_event_complete';
```

Look for `jsonb_array_elements_text` in the output. If it's not there, the migration didn't apply correctly.

### Cause 2: Different Error Location
The error might be in a different function that's called during event creation.

**Potential problem areas:**
- `resolution_systems` table insert
- `markets` table insert
- `orders` table insert (for liquidity)

### Cause 3: Frontend Not Calling Correct Function
The frontend might be calling a different function than expected.

**Check:** Look at the browser's Network tab when clicking "Create Event" to see which API endpoint is being called.

### Cause 4: Timeout
The database function might be taking too long and timing out.

**Check:** Look for timeout errors in Supabase logs.

---

## 🛠️ Quick Fixes to Try

### Fix 1: Replace create_event_complete with Debug Version

If `create_event_debug` works but `create_event_complete` doesn't, replace the original:

```sql
-- Drop the old function
DROP FUNCTION IF EXISTS create_event_complete(JSONB, UUID);

-- Rename debug to original
ALTER FUNCTION create_event_debug(JSONB, UUID) RENAME TO create_event_complete;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION create_event_complete(JSONB, UUID) TO service_role;
```

### Fix 2: Simplify the Function

If the function is too complex and causing timeouts, use a simplified version that only creates the event and market:

```sql
CREATE OR REPLACE FUNCTION create_event_complete(
    p_event_data JSONB,
    p_admin_id UUID
)
RETURNS JSONB AS $$
DECLARE
    v_event_id UUID;
    v_market_id UUID;
BEGIN
    -- Simple event insert
    INSERT INTO events (title, slug, question, category, status, created_by)
    VALUES (
        p_event_data->>'title',
        p_event_data->>'slug',
        p_event_data->>'question',
        COALESCE(p_event_data->>'category', 'general'),
        'active',
        p_admin_id
    )
    RETURNING id INTO v_event_id;
    
    -- Simple market insert
    INSERT INTO markets (event_id, name, question, category, status, created_by)
    VALUES (
        v_event_id,
        p_event_data->>'title',
        p_event_data->>'question',
        COALESCE(p_event_data->>'category', 'general'),
        'active',
        p_admin_id
    )
    RETURNING id INTO v_market_id;
    
    RETURN jsonb_build_object(
        'success', true,
        'event_id', v_event_id,
        'market_id', v_market_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

---

## 📊 Success Criteria

You'll know it's working when:

1. ✅ Running `test_event_creation()` returns success
2. ✅ Running `create_event_complete(...)` returns an event_id
3. ✅ Events list shows > 0 events
4. ✅ Frontend homepage shows active markets
5. ✅ You can click on a market and see its details

---

## 📞 Need More Help?

If you've tried all the above and it's still not working, please share:

1. **Output of `test_event_creation()`**
2. **Output of `create_event_complete(...)` test**
3. **Supabase Postgres logs** (last 50 lines during event creation attempt)
4. **Browser Network tab screenshot** (showing the API call when clicking Create Event)

With this information, I can provide more targeted assistance!
