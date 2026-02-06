const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function checkTables() {
    const tables = ['leagues', 'activities', 'market_comments'];
    console.log('🔍 Checking for new tables...');

    for (const table of tables) {
        const { count, error } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });

        if (error) {
            // 404 or similar means not found usually, but Supabase JS returns error message
            if (error.message.includes('does not exist')) {
                console.log(`❌ Table '${table}' DOES NOT EXIST. Migration needed.`);
            } else {
                console.log(`⚠️ Error checking '${table}': ${error.message}`);
            }
        } else {
            console.log(`✅ Table '${table}' exists.`);
        }
    }
}

checkTables();
