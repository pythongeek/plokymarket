
import { CentralizedOracleStrategy } from './strategies/centralized';
import { MultiSigWallet } from './MultiSigWallet';

async function runTests() {
    console.log('--- CENTRALIZED ORACLE TESTS ---');

    // Test 1: MultiSig Logic
    console.log('Test 1: MultiSig Verification');
    const wallet = new MultiSigWallet();
    const marketId = 'market-123';
    const outcome = 'YES';

    // Valid Signatures (3 unique admins)
    const validSigs = [
        'admin_pub_1:signed:market-123:YES',
        'admin_pub_2:signed:market-123:YES',
        'admin_pub_3:signed:market-123:YES'
    ];

    const isSuccess = await wallet.verifySignatures(marketId, outcome, validSigs);
    if (!isSuccess) throw new Error('Valid signatures failed verification');
    console.log('PASS: Valid 3-of-5 Signatures');

    // Invalid Signatures (Duplicate signer)
    const invalidSigs = [
        'admin_pub_1:signed:market-123:YES',
        'admin_pub_1:signed:market-123:YES', // Duplicate
        'admin_pub_2:signed:market-123:YES'
    ];
    const isFail = await wallet.verifySignatures(marketId, outcome, invalidSigs);
    if (isFail) throw new Error('Duplicate signatures passed (should fail)');
    console.log('PASS: Duplicate Signer Rejection');

    // Test 2: Strategy Execution
    console.log('Test 2: Centralized Strategy Resolve');
    const strategy = new CentralizedOracleStrategy();

    // Mock Context
    const context = {
        signatures: validSigs,
        proposedOutcome: 'YES'
    };

    // We expect this to run. 
    // It will try to call Supabase. Since we don't have Service Role key in this script env typically,
    // it handles "Missing Key" gracefully in the catch/warn block or we should mock the client.
    // The code I wrote: `if (supabaseUrl && supabaseKey) ... else console.warn`
    // So it should not throw.

    try {
        const result = await strategy.resolve(marketId, 'Is this a test?', context);
        if (result.outcome !== 'YES') throw new Error('Outcome mismatch');
        if (result.evidence.confidence !== 1.0) throw new Error('Confidence mismatch');
        console.log('PASS: Strategy Resolve (Logic Check)');
    } catch (e) {
        console.error(e);
        throw new Error('Strategy Failed locally');
    }
}

runTests().catch(e => {
    console.error(e);
    process.exit(1);
});
