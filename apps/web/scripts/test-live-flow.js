const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config({ path: path.join(process.cwd(), '.env.local') });

const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('CRITICAL: Environment variables missing.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runTest() {
    console.log('🚀 STARTING LIVE FLOW TEST...\n');

    try {
        console.log('STEP 1: Creating dummy event...');
        const uniqueSlug = `test-event-${Date.now()}`;
        const endsAt = new Date(Date.now() + 86400000).toISOString();
        const { data: event, error: eventError } = await supabase
            .from('events')
            .insert({
                title: 'Test Live Event ' + Date.now(),
                question: 'Will this test succeed?',
                slug: uniqueSlug,
                category: 'Politics',
                status: 'active',
                ends_at: endsAt
            })
            .select()
            .single();

        if (eventError) throw eventError;
        console.log(`✅ Event Created: ${event.id}\n`);

        console.log('STEP 2: Deploying market with status active...');
        const { data: market, error: marketError } = await supabase
            .from('markets')
            .insert({
                event_id: event.id,
                question: 'Will this test succeed?',
                status: 'active',
                trading_closes_at: event.ends_at,
                event_date: event.ends_at, // Fixed: Added event_date
                category: 'Politics'
            })
            .select()
            .single();

        if (marketError) throw marketError;
        console.log(`✅ Market Deployed: ${market.id}\n`);

        console.log('STEP 3: Initializing Orderbook (Manual simulation of MarketService)...');
        const { data: users } = await supabase.from('users').select('id').limit(1);
        const systemUserId = users?.[0]?.id;
        if (!systemUserId) throw new Error('No system user found');

        const seedBids = [
            { market_id: market.id, user_id: systemUserId, side: 'buy', outcome: 'YES', price: 0.48, quantity: 100, status: 'open', order_type: 'limit' },
            { market_id: market.id, user_id: systemUserId, side: 'buy', outcome: 'NO', price: 0.48, quantity: 100, status: 'open', order_type: 'limit' }
        ];

        const { error: seedError } = await supabase.from('orders').insert(seedBids);
        if (seedError) throw seedError;

        const { data: orders } = await supabase.from('orders').select('*').eq('market_id', market.id);
        console.log(`✅ Initial Liquidity: ${orders.length} orders found (100 YES @ 0.48, 100 NO @ 0.48)`);
        console.table(orders.map(o => ({ outcome: o.outcome, side: o.side, price: o.price, qty: o.quantity })));
        console.log();

        console.log('STEP 4: Simulating user buying 10 YES shares...');
        const userBuyOrder = {
            market_id: market.id,
            user_id: systemUserId,
            side: 'buy',
            outcome: 'YES',
            price: 0.52,
            quantity: 10,
            status: 'open',
            order_type: 'limit'
        };

        const { data: newOrder, error: buyError } = await supabase.from('orders').insert(userBuyOrder).select().single();
        if (buyError) throw buyError;
        console.log(`✅ Buy order placed: ${newOrder.id}`);

        console.log('\n✨ TEST FLOW SUCCESSFUL!');

    } catch (err) {
        console.error('\n❌ TEST FLOW FAILED:');
        console.error(err.message || err);
    }
}

runTest();
