/**
 * Migration 142a Application Script
 * Run: node apply_migration_142a.js
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sltcfmqefujecqfbmkvz.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY;

if (!SUPABASE_SERVICE_KEY) {
  console.error('❌ ERROR: SUPABASE_SERVICE_ROLE_KEY or SUPABASE_SECRET_KEY environment variable required');
  console.error('Set it with: $env:SUPABASE_SERVICE_ROLE_KEY="your_key"');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
  auth: { persistSession: false }
});

const migrationSQL = `
-- STEP 1: Add title column if missing
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public'
    AND table_name = 'events' 
    AND column_name = 'title'
  ) THEN
    ALTER TABLE public.events ADD COLUMN title TEXT;
    RAISE NOTICE '✅ Added title column to events table';
  ELSE
    RAISE NOTICE 'ℹ️ title column already exists';
  END IF;
END $$;

-- STEP 2: Migrate existing data (question → title)
UPDATE public.events 
SET title = question 
WHERE title IS NULL 
AND question IS NOT NULL;

UPDATE public.events 
SET title = name 
WHERE title IS NULL 
AND name IS NOT NULL;

UPDATE public.events 
SET title = REPLACE(slug, '-', ' ')
WHERE title IS NULL 
AND slug IS NOT NULL;

-- STEP 3: Set any remaining NULLs
UPDATE public.events 
SET title = 'Untitled Event ' || id::text
WHERE title IS NULL;

-- STEP 4: Make title NOT NULL
ALTER TABLE public.events ALTER COLUMN title SET NOT NULL;
ALTER TABLE public.events ALTER COLUMN title SET DEFAULT 'New Event';

-- STEP 5: Add sync trigger
CREATE OR REPLACE FUNCTION sync_event_title_question()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.title IS DISTINCT FROM OLD.title AND NEW.question IS NULL THEN
    NEW.question := NEW.title;
  END IF;
  IF NEW.question IS DISTINCT FROM OLD.question AND NEW.title IS NULL THEN
    NEW.title := NEW.question;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_sync_event_title_question ON public.events;
CREATE TRIGGER trigger_sync_event_title_question
  BEFORE INSERT OR UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION sync_event_title_question();
`;

async function applyMigration() {
  console.log('🚀 Applying Migration 142a...\n');
  
  try {
    // Check current state
    console.log('📊 Checking current events table state...');
    const { data: events, error: checkError } = await supabase
      .from('events')
      .select('id, title, question, name, slug')
      .limit(5);
    
    if (checkError) {
      console.error('❌ Error checking events:', checkError.message);
      return;
    }
    
    console.log(`   Found ${events.length} events in database`);
    events.forEach(e => {
      console.log(`   - ID: ${e.id}, Title: ${e.title || 'NULL'}, Question: ${e.question?.substring(0, 30)}...`);
    });
    
    // Run migration SQL via RPC
    console.log('\n🔧 Running migration SQL...');
    const { error: rpcError } = await supabase.rpc('exec_sql', { sql: migrationSQL });
    
    if (rpcError) {
      // If exec_sql doesn't exist, try alternative approach
      console.log('   ⚠️ exec_sql RPC not available, trying direct REST call...');
      
      // Alternative: Use Supabase Management API or direct SQL via pg-meta
      const response = await fetch(`${SUPABASE_URL}/rest/v1/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${SUPABASE_SERVICE_KEY}`,
          'X-Client-Info': 'supabase-js/2.x',
        },
        body: JSON.stringify({ query: migrationSQL }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`SQL execution failed: ${errorText}`);
      }
    }
    
    console.log('✅ Migration SQL executed successfully!\n');
    
    // Verify migration
    console.log('🔍 Verifying migration...');
    const { data: verifyEvents, error: verifyError } = await supabase
      .from('events')
      .select('id, title')
      .filter('title', 'is', null);
    
    if (verifyError) {
      console.error('❌ Error verifying:', verifyError.message);
      return;
    }
    
    if (verifyEvents.length === 0) {
      console.log('✅ All events now have titles!');
    } else {
      console.log(`⚠️ ${verifyEvents.length} events still have NULL titles`);
    }
    
    console.log('\n🎉 Migration 142a completed successfully!');
    console.log('\n⚠️ IMPORTANT: Now apply Migration 142b:');
    console.log('   File: supabase/migrations/142b_upstash_workflow_infrastructure.sql');
    
  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\n💡 MANUAL ACTION REQUIRED:');
    console.error('   1. Go to Supabase Dashboard: https://app.supabase.com');
    console.error('   2. Select your project');
    console.error('   3. Go to SQL Editor');
    console.error('   4. Copy and paste SQL from: apply_migration_142a_now.sql');
    console.error('   5. Click Run');
    process.exit(1);
  }
}

applyMigration();
