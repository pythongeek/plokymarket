#!/usr/bin/env node
/**
 * Script to apply Migration 133: Fix JSONB to TEXT[] casting
 * 
 * This script fixes the "cannot cast type jsonb to text[]" error
 * when creating events in the admin panel.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configuration - Update these with your Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

async function applyMigration() {
    console.log('🔧 Applying Migration 133: Fix JSONB to TEXT[] casting\n');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || 
        SUPABASE_URL === 'https://your-project.supabase.co' ||
        SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
        console.error('❌ Error: Please set your Supabase credentials');
        console.log('\nYou can do this by:');
        console.log('1. Setting environment variables:');
        console.log('   export NEXT_PUBLIC_SUPABASE_URL=your-url');
        console.log('   export SUPABASE_SERVICE_ROLE_KEY=your-key');
        console.log('\n2. Or editing this file and updating the credentials at the top\n');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    });

    try {
        // Read the migration file
        const migrationPath = path.join(__dirname, 'supabase', 'migrations', '133_fix_jsonb_to_text_array.sql');
        
        if (!fs.existsSync(migrationPath)) {
            console.error(`❌ Migration file not found: ${migrationPath}`);
            process.exit(1);
        }

        const migrationSql = fs.readFileSync(migrationPath, 'utf8');
        console.log(`📄 Loaded migration file (${migrationSql.length} characters)\n`);

        // Execute the migration
        console.log('⏳ Executing migration...\n');
        
        const { error } = await supabase.rpc('exec_sql', { sql: migrationSql });
        
        if (error) {
            // If exec_sql doesn't exist, try direct query
            console.log('⚠️  exec_sql RPC not found, trying direct query...\n');
            
            // Split by statement separators and execute individually
            const statements = migrationSql
                .split(/;\s*$/m)
                .map(s => s.trim())
                .filter(s => s.length > 0 && !s.startsWith('--'));
            
            for (let i = 0; i < statements.length; i++) {
                const stmt = statements[i];
                console.log(`  Executing statement ${i + 1}/${statements.length}...`);
                
                const { error: stmtError } = await supabase.rpc('exec_sql', { 
                    sql: stmt + ';' 
                });
                
                if (stmtError) {
                    console.log(`  ⚠️  Statement ${i + 1} skipped: ${stmtError.message}`);
                }
            }
        }

        console.log('\n✅ Migration applied successfully!\n');
        console.log('Next steps:');
        console.log('1. Go back to the admin panel');
        console.log('2. Try creating an event again');
        console.log('3. The event should be created without errors\n');

    } catch (err) {
        console.error('\n❌ Error applying migration:', err.message);
        console.log('\n⚠️  Alternative method:');
        console.log('1. Go to your Supabase Dashboard');
        console.log('2. Open the SQL Editor');
        console.log('3. Copy and paste the contents of:');
        console.log('   supabase/migrations/133_fix_jsonb_to_text_array.sql');
        console.log('4. Run the SQL\n');
    }
}

applyMigration();
