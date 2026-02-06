const { createClient } = require('@supabase/supabase-js');
const fetch = require('node-fetch'); // Needs node-fetch if running in node < 18, but commonly available or use built-in global fetch in modern node

// Load env vars (simulated or explicit)
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY';

if (!SUPABASE_URL || !SUPABASE_KEY || SUPABASE_URL.includes('YOUR_')) {
    console.error('❌ Missing Environment Variables. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const SLEEP = (ms) => new Promise(r => setTimeout(r, ms));

async function main() {
    console.log('\n🎬 STARTING ORACLE LIFECYCLE SIMULATION (Real-World Mimic)\n');
    console.log('-------------------------------------------------------------');

    // STEP 1: CREATE MARKET
    console.log('🔹 Step 1: Creating a "Real-World" Market...');
    const closingTime = new Date();
    closingTime.setSeconds(closingTime.getSeconds() + 10); // Closes in 10s for test

    const { data: market, error: marketError } = await supabase
        .from('markets')
        .insert({
            question: `Will it rain in Dhaka tomorrow? (Sim #${Date.now()})`,
            description: 'Simulation of weather market resolution.',
            category: 'Weather',
            trading_closes_at: closingTime.toISOString(),
            event_date: new Date(Date.now() + 86400000).toISOString(),
            resolution_source_type: 'AI', // This triggers the AI Strategy
            resolution_data: { evidenceText: "Weather reports indicate heavy rain expected in Dhaka." }, // Context for AI
            status: 'active'
        })
        .select()
        .single();

    if (marketError) {
        console.error('❌ Failed to create market:', marketError.message);
        return;
    }
    console.log(`✅ Market Created: "${market.question}" (ID: ${market.id})`);
    console.log(`   Resolution Strategy: ${market.resolution_source_type}`);


    // STEP 2: SIMULATE TRADING (Optional, adds realism)
    console.log('\n🔹 Step 2: Simulating Trading Activity...');
    await SLEEP(1000);
    console.log('   (Skipping explicit orders for speed, assuming volume exists...)');


    // STEP 3: WAIT FOR CLOSE
    console.log('\n🔹 Step 3: Waiting for Market to Close...');
    console.log('   Waiting 5 seconds...');
    await SLEEP(5000);


    // STEP 4: TRIGGER PROPOSAL (The "Oracle")
    console.log('\n🔹 Step 4: Triggering Oracle Proposal...');
    console.log('   Use-Case: Cron job hits /api/oracle/resolve or Event Trigger');

    // Here we manually insert the proposal to mimic the Service logic 
    // because we can't easily import the TS Service class into this JS script without build step.
    // In production, the "OracleService.proposeOutcome()" does exactly this.

    const challengeWindow = new Date();
    challengeWindow.setSeconds(challengeWindow.getSeconds() + 5); // Short window for test

    const { data: proposal, error: propError } = await supabase
        .from('oracle_requests')
        .insert({
            market_id: market.id,
            request_type: 'initial',
            status: 'proposed',
            // AI Logic Output Simulation
            proposed_outcome: 'YES',
            confidence_score: 0.88,
            evidence_text: 'Weather.com predicts 80% precipitation.',
            bond_amount: 100,
            bond_currency: 'BDT',
            challenge_window_ends_at: challengeWindow.toISOString()
        })
        .select()
        .single();

    if (propError) {
        console.error('❌ Failed to post Proposal:', propError.message);
        return;
    }
    console.log(`✅ Outcome Proposed: "${proposal.proposed_outcome}"`);
    console.log(`   Bond Staked: ৳${proposal.bond_amount}`);
    console.log(`   Challenge Window: Ends in 5 seconds...`);


    // STEP 5: CHALLENGE WINDOW (Wait or Dispute?)
    console.log('\n🔹 Step 5: Challenge Period...');
    // Let's decide NOT to dispute to show the "Happy Path" (Optimistic Success)
    console.log('   No disputes detected. Waiting for window expiry...');
    await SLEEP(6000);


    // STEP 6: FINALIZATION
    console.log('\n🔹 Step 6: Finalizing Market...');
    // Logic: Check time > window. No disputes. -> Resolve Market.

    const now = new Date();
    const winEnd = new Date(proposal.challenge_window_ends_at);

    if (now > winEnd && proposal.status === 'proposed') {
        console.log('   Window passed. Finalizing...');

        // Update Request
        await supabase.from('oracle_requests')
            .update({ status: 'finalized', finalized_at: now.toISOString() })
            .eq('id', proposal.id);

        // Update Market
        await supabase.from('markets')
            .update({
                status: 'resolved',
                winning_outcome: proposal.proposed_outcome,
                resolved_at: now.toISOString()
            })
            .eq('id', market.id);

        console.log(`✅ Market Resolved to: ${proposal.proposed_outcome}`);
    } else {
        console.log('❌ Logic Error: Window not passed or status wrong.');
    }

    // VALIDATION
    const { data: finalMarket } = await supabase.from('markets').select('*').eq('id', market.id).single();
    console.log('\n-------------------------------------------------------------');
    console.log('🎉 SIMULATION COMPLETE');
    console.log(`Market Status: ${finalMarket.status}`);
    console.log(`Winner: ${finalMarket.winning_outcome}`);
    console.log('-------------------------------------------------------------');
}

main();
