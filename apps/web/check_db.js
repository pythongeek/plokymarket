const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Missing env vars');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkSchema() {
    console.log('Testing Event -> Market linkage...');

    // 1. Create Event
    const { data: event, error: eventError } = await supabase
        .from('events')
        .insert({
            title: 'Test Event ' + Date.now(),
            slug: 'test-event-' + Date.now(),
            category: 'Technology',
            is_active: true
        })
        .select()
        .single();

    if (eventError) {
        console.error('ERROR during event insertion:');
        console.error(JSON.stringify(eventError, null, 2));
        return;
    }

    console.log('SUCCESS: Event created with ID:', event.id);

    // 2. Create Market linked to Event
    const { data: market, error: marketError } = await supabase
        .from('markets')
        .insert({
            event_id: event.id,
            name: 'Test Market linked to Event',
            question: 'Will this linked market be created? ' + Date.now(),
            description: 'Testing event_id linkage',
            category: 'Technology',
            status: 'active',
            trading_closes_at: new Date(Date.now() + 86400000).toISOString(),
            event_date: new Date(Date.now() + 86400000).toISOString()
        })
        .select()
        .single();

    if (marketError) {
        console.error('ERROR during market insertion:');
        console.error(JSON.stringify(marketError, null, 2));
    } else {
        console.log('SUCCESS: Market created with ID:', market.id);
    }
}

checkSchema();
