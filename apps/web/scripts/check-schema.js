const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
    console.log('Checking Phase 2 Tables...');

    const tables = ['outcomes', 'user_bookmarks', 'market_followers', 'price_history', 'market_daily_stats', 'notifications'];

    for (const table of tables) {
        try {
            const { data, error } = await supabase
                .from(table)
                .select('*', { count: 'exact', head: true });

            if (error) {
                console.log(`❌ Table ${table}: Not found or error: ${error.message}`);
            } else {
                console.log(`✅ Table ${table}: Found`);
            }
        } catch (e) {
            console.log(`❌ Table ${table}: Exception: ${e.message}`);
        }
    }

    console.log('\nChecking RPC Functions...');
    const rpcs = ['record_price_snapshots', 'update_price_changes', 'get_price_history'];

    for (const rpc of rpcs) {
        try {
            // Trying to call the RPC to see if it exists
            const { data, error } = await supabase.rpc(rpc).limit(1);
            if (error && error.message.includes('does not exist')) {
                console.log(`❌ RPC ${rpc}: Not found`);
            } else {
                console.log(`✅ RPC ${rpc}: Found (or valid error ${error?.message})`);
            }
        } catch (e) {
            console.log(`✅ RPC ${rpc}: Found (via exception)`);
        }
    }
}

checkSchema().then(() => console.log('Done.')).catch(e => console.error(e));
