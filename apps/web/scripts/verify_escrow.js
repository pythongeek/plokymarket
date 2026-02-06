const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sltcfmqefujecqfbmkvz.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;
const API_URL = 'https://polymarket-bangladesh.vercel.app/api/orders';

const TEST_USER_ID = '3574357a-0b1e-40c3-bb8d-614bf33b4224'; // Existing health-check user
const TEST_MARKET_ID = '3574357a-0b1e-40c3-bb8d-614bf33b4224'; // Mock market ID

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function runTest() {
    console.log('--- STARTING ESCROW VERIFICATION ---');

    // 1. Setup Initial State (Using RPC if direct insert fails or assume it exists)
    // We try to upsert manually. 
    // If it fails due to column names, we'll catch it.
    console.log('Setting up wallet for test user...');
    try {
        const { error: upsertError } = await supabase
            .from('wallets')
            .upsert({
                user_id: TEST_USER_ID,
                balance: 1000,
                // frozen_balance: 0 // Omitting for now to see if schema cache is the issue
            });

        if (upsertError) {
            console.error('Wallet Setup Error:', upsertError.message);
            // If it failed because of frozen_balance, it means we might need to use RPC or trust defaults
        }
    } catch (e) {
        console.error('Setup Exception:', e.message);
    }

    // 2. Capture Baseline
    const { data: before } = await supabase
        .from('wallets')
        .select('balance, frozen_balance')
        .eq('user_id', TEST_USER_ID)
        .single();

    console.log('Baseline Balance:', before?.balance);
    console.log('Baseline Frozen:', before?.frozen_balance);

    if (!before) {
        console.error('FAILED: Baseline wallet not found. Check if table "wallets" exists and is readable.');
        return;
    }

    // 3. Place Order ($10 BUY)
    console.log('Placing $10 BUY order via Production API...');
    const orderResponse = await fetch(API_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            marketId: TEST_MARKET_ID,
            userId: TEST_USER_ID,
            side: 'BUY',
            price: 1, // $1
            size: 10   // 10 units = $10
        })
    });

    const orderResult = await orderResponse.json();
    console.log('Order API Status:', orderResponse.status);
    console.log('Order API Result:', JSON.stringify(orderResult));

    // 4. Capture Post-Trade State
    const { data: after } = await supabase
        .from('wallets')
        .select('balance, frozen_balance')
        .eq('user_id', TEST_USER_ID)
        .single();

    console.log('Final Balance:', after?.balance);
    console.log('Final Frozen:', after?.frozen_balance);

    // 5. Analysis
    const balanceDiff = parseFloat(before.balance) - parseFloat(after.balance);
    const frozenDiff = parseFloat(after.frozen_balance) - parseFloat(before.frozen_balance);

    console.log('--- RESULTS ---');
    console.log(`Balance Change: -${balanceDiff}`);
    console.log(`Frozen Change: +${frozenDiff}`);

    if (balanceDiff === 10 && frozenDiff === 10) {
        console.log('✅ SUCCESS: Risk Engine atomically locked $10 in escrow.');
    } else {
        console.log('❌ FAILURE: Atomic escrow mismatch.');
    }
}

runTest();
