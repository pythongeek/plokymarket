const { createClient } = require('@supabase/supabase-js');

// Helper to wait
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'YOUR_SUPABASE_URL';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'YOUR_SERVICE_KEY';

if (SUPABASE_URL === 'YOUR_SUPABASE_URL') {
    console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables.');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function main() {
    console.log('🧪 Starting Optimistic Oracle System Test...');

    // 1. Create a Test Market
    console.log('1. Creating Test Market...');
    const { data: market, error: marketError } = await supabase
        .from('markets')
        .insert({
            question: 'Will Bitcoin hit $100k by 2025? (Optimistic Test)',
            description: 'Test market for Optimistic AI Oracle.',
            category: 'Crypto',
            trading_closes_at: new Date(Date.now() + 86400000).toISOString(), // Tomorrow
            event_date: new Date(Date.now() + 172800000).toISOString(),
            resolution_source_type: 'AI',
            status: 'active'
        })
        .select()
        .single();

    if (marketError) {
        console.error('Failed to create market:', marketError);
        return;
    }
    console.log('✅ Market created:', market.id);

    // 2. Trigger Proposal (Optimistic)
    console.log('2. Triggering Proposal via Service (Simulation)...');

    // In a real integration test, we would hit the API: POST /api/oracle/resolve
    // Here we simulate the functionality of the service if we could import it, 
    // but since we are in a raw JS script without the app context, we will manually insert the PROPOSAL
    // to verify the DB triggers/constraints work (or just to show the flow).

    const challengeEndsAt = new Date();
    challengeEndsAt.setHours(challengeEndsAt.getHours() + 2); // 2 hour window

    const { data: proposal, error: propError } = await supabase
        .from('oracle_requests')
        .insert({
            market_id: market.id,
            request_type: 'initial',
            status: 'proposed',
            proposed_outcome: 'YES',
            confidence_score: 0.95,
            bond_amount: 50,
            bond_currency: 'BDT',
            challenge_window_ends_at: challengeEndsAt.toISOString()
        })
        .select()
        .single();

    if (propError) {
        console.error('Failed to create proposal:', propError);
        return;
    }

    console.log('✅ Proposal Created (Optimistic):', proposal.id);
    console.log('   Status:', proposal.status);
    console.log('   Bond:', proposal.bond_amount);
    console.log('   Challenge Window Ends:', proposal.challenge_window_ends_at);

    // 3. Simulate a Challenge (Optional)
    console.log('3. Simulating a Challenge...');
    const { data: dispute, error: disError } = await supabase
        .from('oracle_disputes')
        .insert({
            request_id: proposal.id,
            disputer_id: market.created_by || '00000000-0000-0000-0000-000000000000', // Mock ID
            bond_amount: 50,
            reason: 'I disagree with AI',
            status: 'open'
        })
        .select()
        .single();

    if (disError) {
        console.log('   (Expected failure if foreign key User ID mock doesnt exist)');
    } else {
        console.log('✅ Dispute Created:', dispute.id);

        // Update Request status
        await supabase.from('oracle_requests').update({ status: 'disputed' }).eq('id', proposal.id);
        console.log('✅ Request Status updated to DISPUTED');
    }

    // Cleanup
    console.log('4. Cleaning up...');
    // await supabase.from('markets').delete().eq('id', market.id);
    console.log('Test Complete. Check Admin Panel.');
}

main().catch(console.error);
