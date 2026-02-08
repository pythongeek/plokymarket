const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const SUPABASE_URL = env.SUPABASE_URL || env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = env.SUPABASE_SECRET_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error('Missing Supabase credentials');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedOrderBook() {
    console.log('--- SEEDING ORDER BOOK DATA ---');

    // 1. Get Bangladeshi markets
    const { data: markets, error: mError } = await supabase
        .from('markets')
        .select('id, question')
        .ilike('category', 'Economy') // or other relevant categories
        .limit(10);

    if (mError) throw mError;
    if (!markets || markets.length === 0) {
        console.log('No markets found to seed.');
        return;
    }

    // 2. Mock User ID (System or Admin)
    const { data: users } = await supabase.from('users').select('id').limit(1);
    const userId = users[0].id;

    for (const market of markets) {
        console.log(`Seeding order book for: ${market.question}`);

        // Generate a spread around 0.50
        const midPrice = 0.50;
        const spread = 0.04;

        // Bids: 0.48, 0.47, 0.46...
        // Asks: 0.52, 0.53, 0.54...

        const orderLevels = [
            { side: 'buy', outcome: 'YES', prices: [0.49, 0.48, 0.47, 0.45] },
            { side: 'sell', outcome: 'YES', prices: [0.51, 0.52, 0.53, 0.55] },
            { side: 'buy', outcome: 'NO', prices: [0.49, 0.48, 0.47, 0.45] },
            { side: 'sell', outcome: 'NO', prices: [0.51, 0.52, 0.53, 0.55] }
        ];

        for (const group of orderLevels) {
            for (const price of group.prices) {
                const qty = Math.floor(Math.random() * 500) + 100;

                await supabase.from('orders').insert({
                    market_id: market.id,
                    user_id: userId,
                    side: group.side,
                    outcome: group.outcome,
                    price: price,
                    quantity: qty,
                    filled_quantity: 0,
                    status: 'open',
                    order_type: 'limit'
                });
            }
        }
    }

    console.log('✅ Seeding complete!');
}

seedOrderBook().catch(console.error);
