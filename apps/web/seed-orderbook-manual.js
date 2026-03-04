// Manual orderbook seeding script - run with: node seed-orderbook-manual.js
require('dotenv').config({ path: './.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
    console.error('SERVICE_ROLE_KEY is required for this script');
    console.log('Please set SUPABASE_SERVICE_ROLE_KEY in .env.local');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
});

async function seedOrderbook() {
    console.log('=== Manual Orderbook Seeding ===\n');

    // Get all markets without orders
    console.log('1. Finding markets without orders...');

    const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('id, event_id, name, initial_liquidity, liquidity')
        .eq('status', 'active');

    if (marketsError) {
        console.error('   Error:', marketsError.message);
        return;
    }

    console.log(`   Found ${markets.length} active markets`);

    // Get admin user ID
    const { data: adminUser } = await supabase
        .from('user_profiles')
        .select('id')
        .eq('is_admin', true)
        .limit(1)
        .maybeSingle();

    if (!adminUser) {
        console.error('   No admin user found, using placeholder');
    }

    const adminId = adminUser?.id || '00000000-0000-0000-0000-000000000001';
    console.log(`   Using admin ID: ${adminId}\n`);

    // Seed each market
    for (const market of markets) {
        console.log(`2. Checking market: ${market.name}`);

        // Check if orders already exist
        const { data: existingOrders } = await supabase
            .from('orders')
            .select('id')
            .eq('market_id', market.id)
            .limit(1);

        if (existingOrders && existingOrders.length > 0) {
            console.log('   Skipping - orders already exist\n');
            continue;
        }

        // Calculate seed quantity
        const initialLiquidity = market.initial_liquidity || market.liquidity || 10000;
        const seedPrice = 0.48;
        const quantity = Math.floor(initialLiquidity / 2 / seedPrice);

        console.log(`   Initial liquidity: ${initialLiquidity}`);
        console.log(`   Seed price: ${seedPrice}`);
        console.log(`   Quantity per side: ${quantity}`);

        // Create seed orders with explicit uppercase
        const seedOrders = [
            {
                market_id: market.id,
                user_id: adminId,
                order_type: 'limit',
                side: 'buy',
                outcome: 'YES',  // Explicit uppercase
                price: seedPrice,
                quantity: quantity,
                filled_quantity: 0,
                status: 'open'
            },
            {
                market_id: market.id,
                user_id: adminId,
                order_type: 'limit',
                side: 'buy',
                outcome: 'NO',  // Explicit uppercase
                price: seedPrice,
                quantity: quantity,
                filled_quantity: 0,
                status: 'open'
            }
        ];

        console.log('   Inserting orders...');
        const { error: insertError } = await supabase
            .from('orders')
            .insert(seedOrders);

        if (insertError) {
            console.error(`   ERROR: ${insertError.message}`);
            console.error(`   Code: ${insertError.code}`);
            console.error(`   Details: ${JSON.stringify(insertError)}`);
        } else {
            console.log('   SUCCESS: Orderbook seeded!');
        }
        console.log('');
    }

    // Verify final count
    console.log('3. Verifying orders...');
    const { count } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    console.log(`   Total orders in database: ${count}`);
    console.log('\n=== Seeding Complete ===');
}

seedOrderbook().catch(console.error);
