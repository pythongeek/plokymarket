const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
(async () => {
    const { data: events } = await supabase.from('events').select('id, title, status, created_at').order('created_at', { ascending: false }).limit(25);
    console.log('--- RECENT EVENTS ---');
    console.log(events.map(e => e.title + ' (' + e.status + ')').join('\n'));

    const { data: markets } = await supabase.from('markets').select('id, question, status, created_at, event_id').order('created_at', { ascending: false }).limit(25);
    console.log('\n--- RECENT MARKETS ---');
    console.log(markets.map(m => m.question + ' (' + m.status + ') [Event: ' + m.event_id + ']').join('\n'));
})();
