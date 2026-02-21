import { marketService } from '../apps/web/src/lib/services/MarketService';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../apps/web/.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSeeding() {
    console.log('--- Orderbook Seeding Test ---');

    // 1. Create a mock market (active status)
    const mockMarketId = '00000000-0000-0000-0000-000000000000'; // Replace with a valid ID if needed for actual DB run

    console.log(`Testing initializeOrderbook for market: ${mockMarketId}`);

    try {
        await marketService.initializeOrderbook(mockMarketId);

        // 2. Verify results in DB
        const { data: orders, error } = await supabase
            .from('orders')
            .select('*')
            .eq('market_id', mockMarketId);

        if (error) {
            console.error('Error fetching orders:', error);
            return;
        }

        console.log('Seeded Orders:');
        console.table(orders.map(o => ({
            outcome: o.outcome,
            side: o.side,
            price: o.price,
            quantity: o.quantity,
            status: o.status
        })));

        if (orders.length === 2 &&
            orders.every(o => o.price === 0.48 && o.side === 'buy' && o.quantity === 100)) {
            console.log('✅ Seeding Logic Verified!');
        } else {
            console.log('❌ Seeding Logic Failed Verification.');
        }

    } catch (err) {
        console.error('Test failed:', err);
    }
}

// Note: This script is intended for demonstration/manual execution.
// Running it against a real database requires a valid market_id.
// testSeeding();
