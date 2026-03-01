// scripts/stress-test-wallet.ts
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

async function stressTestWallet(userId: string) {
    const sb = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log(`Starting stress test for user: ${userId}`);

    // Initial balance check
    const { data: before } = await sb.from('wallets')
        .select('balance, locked_balance').eq('user_id', userId).single();

    console.log('Before balance:', before?.balance);
    console.log('Before locked:', before?.locked_balance);

    // 10 concurrent requests to simulate rapid double-spending attempts
    // Place an atomic order which handles the required balance logic in a single transaction
    const dummyMarketId = '77cecbe8-3683-4743-998a-9c700dc72580'; // Active DB market
    const requests = Array(10).fill(null).map((_, i) =>
        sb.rpc('place_order_atomic', {
            p_user_id: userId,
            p_market_id: dummyMarketId,
            p_side: 'buy',
            p_outcome: 'YES',
            p_price: 0.5,
            p_quantity: 100, // Cost = 50 BDT each
            p_idempotency_key: `stress-test-${Date.now()}-${i}`
        })
            .then(r => ({ index: i, success: !r.error && !r.data?.error, data: r.data, error: r.error || r.data?.error }))
    );

    const results = await Promise.all(requests);
    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    console.log(`\nResults: ${successCount} successful, ${failureCount} failed (insufficient balance or locks)`);

    if (successCount > 0) {
        console.log('Example successful execution:', results.find(r => r.success)?.data);
    }

    // Final balance check
    const { data: after } = await sb.from('wallets')
        .select('balance, locked_balance').eq('user_id', userId).single();

    console.log('\nAfter balance:', after?.balance);
    console.log('After locked:', after?.locked_balance);

    // Expected: balance + locked_balance === initial total
    const initialTotal = parseFloat(before?.balance || 0) + parseFloat(before?.locked_balance || 0);
    const finalTotal = parseFloat(after?.balance || 0) + parseFloat(after?.locked_balance || 0);

    const intact = Math.abs(initialTotal - finalTotal) < 0.0001; // Avoid floating point rounding issues

    console.log(intact
        ? '✅ Financial integrity perfectly maintained.'
        : `❌ INTEGRITY VIOLATION DETECTED! Expected ${initialTotal}, Got ${finalTotal}`);
}

// Pass user ID as argument
const userIdArg = process.argv[2];
if (!userIdArg) {
    console.error("Please provide a user ID. Usage: npx ts-node scripts/stress-test-wallet.ts <user_uuid>");
    process.exit(1);
}

stressTestWallet(userIdArg).catch(console.error);
