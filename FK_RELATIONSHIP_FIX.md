# Foreign Key Relationship Fix - PGRST200 Error

## 🔴 The Error

```
Could not find a relationship between 'events' and 'markets' in the schema cache
```

This error means:
1. The frontend is trying to query events with their related markets
2. PostgREST (Supabase's REST API) cannot find the foreign key relationship
3. The query `events?select=*,markets(id)` fails

## 🛠️ The Fix

I've created **Migration 136** that:

1. **Adds missing columns** to events table:
   - `name` - Frontend expects this
   - `name_en` - Frontend expects this  
   - `event_date` - Frontend expects this
   - `status` - Frontend filters by 'published'

2. **Fixes foreign key relationship**:
   - Ensures `markets.event_id` column exists
   - Drops old constraint if exists
   - Creates new FK: `markets.event_id → events.id`

3. **Creates indexes** for performance

4. **Reloads PostgREST schema cache**

## 🚀 How to Apply

### Step 1: Run Migration 136

Go to Supabase SQL Editor and run:

```sql
-- Copy the entire contents of:
-- supabase/migrations/136_fix_events_columns_and_fk.sql
```

### Step 2: Verify the Fix

Run this query to check if the relationship now exists:

```sql
-- Check foreign keys
SELECT
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage ccu ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'markets';
```

**Expected output:**
```
constraint_name      | table_name | column_name | foreign_table_name
---------------------|------------|-------------|-------------------
markets_event_id_fkey| markets    | event_id    | events
```

### Step 3: Test the API Query

Try this query in Supabase SQL Editor to simulate what the frontend does:

```sql
-- This is what the frontend tries to do:
SELECT 
    e.id,
    e.name,
    e.category,
    e.status,
    m.id AS market_id
FROM events e
LEFT JOIN markets m ON m.event_id = e.id
WHERE e.status = 'published'
AND m.id IS NULL;
```

If this works, the PostgREST API should also work.

### Step 4: Reload the Page

After applying the migration:
1. Go to `https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2/markets`
2. Check browser console - the PGRST200 error should be gone
3. Try creating an event again

## 📋 What Was Wrong

The frontend code was trying to query:
```javascript
// From the error message:
/events?select=id,name,name_en,category,event_date,status,markets(id)
```

This requires:
1. `events` table to have columns: `id`, `name`, `name_en`, `category`, `event_date`, `status`
2. `markets` table to have `event_id` column
3. A foreign key constraint linking `markets.event_id → events.id`

**The missing pieces were:**
- Events table was missing `name`, `name_en`, `event_date` columns
- The FK relationship wasn't properly recognized by PostgREST

## ✅ Success Criteria

After applying the fix:

1. **Console errors gone** - No more PGRST200 errors
2. **API queries work** - Can fetch events with their markets
3. **Event creation works** - Can create events successfully
4. **Markets show linked events** - Events appear in markets list

## 🧪 Test Query

Once applied, this query should work in Supabase:

```sql
-- Test event creation
INSERT INTO events (
    title, name, name_en, question, category, 
    status, event_date, trading_closes_at, created_by
) VALUES (
    'Test Event',
    'Test Event',
    'Test Event',
    'Will this work?',
    'sports',
    'published',
    NOW() + INTERVAL '7 days',
    NOW() + INTERVAL '7 days',
    (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
)
RETURNING id;
```

Then create a linked market:
```sql
INSERT INTO markets (
    event_id, name, question, category, status, created_by
) VALUES (
    'THE_EVENT_ID_FROM_ABOVE',
    'Test Market',
    'Will this work?',
    'sports',
    'active',
    (SELECT id FROM user_profiles WHERE is_admin = true LIMIT 1)
);
```

## 📝 Additional Notes

- The `NOTIFY pgrst, 'reload schema'` command forces PostgREST to refresh its cache
- Without this, PostgREST might not see the new foreign key immediately
- If the error persists after applying the migration, wait 30 seconds and refresh the page
