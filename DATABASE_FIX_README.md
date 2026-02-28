# Database Schema Fix - JSONB to TEXT[] Casting Error

## 🔴 Problem Description

When trying to create an event in the admin panel, you get this error:
```
cannot cast type jsonb to text[]
```

This happens because:
1. The `events` and `markets` tables have `tags`, `ai_keywords`, and `ai_sources` columns defined as `TEXT[]` (text array)
2. The application sends these fields as JSONB arrays (e.g., `["sports", "cricket"]`)
3. PostgreSQL cannot directly cast `JSONB` → `TEXT[]` using the `::TEXT[]` syntax

## ✅ Solution

I've created **Migration 133** that fixes the casting functions to properly convert JSONB arrays to TEXT arrays.

### Files Created:
1. `supabase/migrations/133_fix_jsonb_to_text_array.sql` - The database migration
2. `apply_migration_133.js` - Helper script to apply the migration

## 🚀 How to Apply the Fix

### Method 1: Using Supabase SQL Editor (Recommended)

1. Go to your [Supabase Dashboard](https://app.supabase.com)
2. Select your project
3. Go to the **SQL Editor** section
4. Click **New Query**
5. Open the file `supabase/migrations/133_fix_jsonb_to_text_array.sql`
6. Copy the entire contents
7. Paste into the SQL Editor
8. Click **Run**

### Method 2: Using the Node.js Script

1. First, make sure you have the required environment variables:
```bash
export NEXT_PUBLIC_SUPABASE_URL="https://your-project.supabase.co"
export SUPABASE_SERVICE_ROLE_KEY="your-service-role-key"
```

2. Run the script:
```bash
cd "f:\My profession\Hybrid APPs\Plokymarket"
node apply_migration_133.js
```

### Method 3: Using Supabase CLI (if you have it installed)

```bash
supabase db reset
# OR for production:
supabase db push
```

## 🧪 Testing the Fix

After applying the migration:

1. Go to the admin panel: `https://polymarket-bangladesh.vercel.app/sys-cmd-7x9k2`
2. Login with admin credentials
3. Navigate to Events → Create New Event
4. Fill out the form:
   - Title: "বাংলাদেশ বনাম ভারত ক্রিকেট ম্যাচ ২০২৬"
   - Question: "বাংলাদেশ বনাম ভারত ক্রিকেট ম্যাচে কে জয়ী হবে?"
   - Category: Sports → Cricket
   - Trading closes: Any future date
   - Resolution method: Manual (Admin)
5. Click "Create Event"

The event should now be created successfully!

## 🔧 What the Migration Does

The migration:

1. **Fixes `create_event_complete()` function** (from migration 094)
   - Properly converts JSONB arrays to TEXT[] using `jsonb_array_elements_text()`
   - Handles empty/null arrays safely

2. **Fixes `create_event_with_markets()` function** (from migration 123/125)
   - Same JSONB → TEXT[] conversion fix
   - Maintains backward compatibility

3. **Ensures column types**
   - Adds missing columns (`answer_type`, `answer1`, `answer2`) to markets table
   - Converts any `jsonb` tags columns to `TEXT[]` if needed

4. **Grants proper permissions**
   - Allows authenticated users to execute the fixed functions

## 📋 Technical Details

### The Issue
```sql
-- This FAILS:
INSERT INTO events (tags) VALUES ('["sports", "cricket"]'::JSONB::TEXT[]);
-- ERROR: cannot cast type jsonb to text[]

-- This WORKS:
INSERT INTO events (tags) VALUES (ARRAY(SELECT jsonb_array_elements_text('["sports", "cricket"]'::JSONB)));
-- SUCCESS
```

### The Fix
The migration updates the functions to use the proper conversion method:
```sql
IF p_event_data->'tags' IS NOT NULL AND jsonb_array_length(p_event_data->'tags') > 0 THEN
    SELECT ARRAY(SELECT jsonb_array_elements_text(p_event_data->'tags')) INTO v_tags;
ELSE
    v_tags := ARRAY[]::TEXT[];
END IF;
```

## 🆘 Still Having Issues?

If you still see errors after applying the migration:

1. **Check Supabase Logs**
   - Go to Supabase Dashboard → Logs → Postgres
   - Look for the exact error message

2. **Verify Column Types**
   Run this query in SQL Editor:
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'events' 
   AND column_name IN ('tags', 'ai_keywords', 'ai_sources');
   ```
   All should show `ARRAY` or `text[]`

3. **Check Function Version**
   ```sql
   SELECT proname, prosrc 
   FROM pg_proc 
   WHERE proname = 'create_event_complete';
   ```
   Verify it includes the `jsonb_array_elements_text` calls

4. **Contact Support**
   - Share the exact error message from Supabase logs
   - Include the output of the verification queries above

## 📝 Summary

| Before Fix | After Fix |
|-----------|-----------|
| ❌ Event creation fails | ✅ Event creation works |
| ❌ "cannot cast type jsonb to text[]" error | ✅ Proper JSONB → TEXT[] conversion |
| ❌ 0 events in database | ✅ Events created successfully |
| ❌ Markets not created | ✅ Markets linked to events |

Apply the migration and you should be able to create events successfully! 🎉
