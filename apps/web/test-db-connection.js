// Test database connection and schema
require('dotenv').config({ path: './.env.local' });

const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase credentials');
    console.log('NEXT_PUBLIC_SUPABASE_URL:', supabaseUrl ? 'set' : 'NOT SET');
    console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT SET');
    console.log('SUPABASE_ANON_KEY:', process.env.SUPABASE_ANON_KEY ? 'set' : 'NOT SET');
    console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'set' : 'NOT SET');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testDatabase() {
    console.log('=== Testing Database Connection ===\n');

    // Test 1: Check if we can connect
    console.log('1. Testing connection...');
    const { data: testData, error: testError } = await supabase
        .from('markets')
        .select('id')
        .limit(1);

    if (testError) {
        console.error('   Connection failed:', testError.message);
        return;
    }
    console.log('   Connection OK\n');

    // Test 2: Check markets count
    console.log('2. Checking markets count...');
    const { count: marketCount, error: marketError } = await supabase
        .from('markets')
        .select('*', { count: 'exact', head: true });

    if (marketError) {
        console.error('   Error:', marketError.message);
    } else {
        console.log('   Markets count:', marketCount);
    }

    // Test 3: Check events count
    console.log('3. Checking events count...');
    const { count: eventCount, error: eventError } = await supabase
        .from('events')
        .select('*', { count: 'exact', head: true });

    if (eventError) {
        console.error('   Error:', eventError.message);
    } else {
        console.log('   Events count:', eventCount);
    }

    // Test 4: Get sample markets
    console.log('4. Sample markets:');
    const { data: markets, error: marketsError } = await supabase
        .from('markets')
        .select('id, event_id, name, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (marketsError) {
        console.error('   Error:', marketsError.message);
    } else if (markets && markets.length > 0) {
        markets.forEach(m => {
            console.log(`   - ${m.id}: ${m.name} (${m.status})`);
        });
    } else {
        console.log('   No markets found');
    }

    // Test 5: Get sample events
    console.log('5. Sample events:');
    const { data: events, error: eventsError } = await supabase
        .from('events')
        .select('id, title, status, created_at')
        .order('created_at', { ascending: false })
        .limit(5);

    if (eventsError) {
        console.error('   Error:', eventsError.message);
    } else if (events && events.length > 0) {
        events.forEach(e => {
            console.log(`   - ${e.id}: ${e.title} (${e.status})`);
        });
    } else {
        console.log('   No events found');
    }

    // Test 6: Check orders table
    console.log('6. Checking orders:');
    const { count: orderCount, error: orderError } = await supabase
        .from('orders')
        .select('*', { count: 'exact', head: true });

    if (orderError) {
        console.error('   Error:', orderError.message);
    } else {
        console.log('   Orders count:', orderCount);
    }

    // Test 7: Try inserting a test order to check enum
    console.log('7. Testing order insert with uppercase YES/NO:');
    try {
        // First get a market ID
        if (markets && markets.length > 0) {
            const testOrder = {
                market_id: markets[0].id,
                user_id: '00000000-0000-0000-0000-000000000001', // Test user
                order_type: 'limit',
                side: 'buy',
                outcome: 'YES',
                price: 0.50,
                quantity: 100,
                filled_quantity: 0,
                status: 'open'
            };

            const { error: insertError } = await supabase
                .from('orders')
                .insert(testOrder);

            if (insertError) {
                console.error('   Insert error:', insertError.message);
                console.error('   Details:', JSON.stringify(insertError));
            } else {
                console.log('   Insert OK with uppercase YES');
            }
        } else {
            console.log('   Skipped - no markets available');
        }
    } catch (err) {
        console.error('   Exception:', err.message);
    }

    console.log('\n=== Test Complete ===');
}

testDatabase().catch(console.error);
