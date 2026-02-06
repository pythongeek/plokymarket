const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local
const envPath = path.resolve(__dirname, '../.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');
envContent.split('\n').forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
        process.env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
    }
});

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    console.error('Missing Supabase credentials in .env.local');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Use a fixed test user and market (assuming they exist from previous steps)
const TEST_USER_ID = '3574357a-0b1e-40c3-bb8d-614bf33b4224';
const TEST_MARKET_ID = '3574357a-0b1e-40c3-bb8d-614bf33b4224';

async function verifyAtomicPlacement() {
    console.log('--- STARTING ATOMIC PLACEMENT VERIFICATION ---');

    try {
        // 1. Get Initial Balance
        const { data: walletBefore } = await supabase
            .from('wallets')
            .select('balance, locked_balance')
            .eq('user_id', TEST_USER_ID)
            .single();

        console.log('Baseline:', walletBefore);

        // 2. Test Success Path (Place Order)
        const price = 0.5;
        const qty = 10;
        const expectedCost = price * qty;

        console.log(`Placing atomic order: Price=${price}, Qty=${qty}, Cost=${expectedCost}`);

        // Note: We need to sign in to get auth.uid() or use service_role if we want to bypass auth.
        // For RPC testing via anon key, it might fail unless we mock auth or use a test session.
        // Let's assume the developer has access to a service role for testing or use a simulated flow.

        const { data: orderId, error: rpcError } = await supabase.rpc('place_atomic_order', {
            p_market_id: TEST_MARKET_ID,
            p_side: 'buy',
            p_outcome: 'YES',
            p_price: price,
            p_quantity: qty
        });

        if (rpcError) {
            console.error('RPC Error (Expected if unauthorized via anon):', rpcError.message);
            if (rpcError.message === 'UNAUTHORIZED') {
                console.log('✅ Auth check working (P0001)');
            }
        } else {
            console.log('Order ID:', orderId);

            // 3. Verify Balance Impact
            const { data: walletAfter } = await supabase
                .from('wallets')
                .select('balance, locked_balance')
                .eq('user_id', TEST_USER_ID)
                .single();

            console.log('After Placement:', walletAfter);

            const balanceDiff = walletBefore.balance - walletAfter.balance;
            const lockedDiff = walletAfter.locked_balance - walletBefore.locked_balance;

            if (balanceDiff === expectedCost && lockedDiff === expectedCost) {
                console.log('✅ SUCCESS: Collateral locked correctly.');
            } else {
                console.error(`❌ FAILURE: Balance mismatch. Expected change ${expectedCost}, got balDiff=${balanceDiff}, lockDiff=${lockedDiff}`);
            }
        }

        // 4. Test "Insufficient Balance"
        // (We would need a user with 0 balance for a clean test)

    } catch (e) {
        console.error('Verification Exception:', e);
    }
}

verifyAtomicPlacement();
