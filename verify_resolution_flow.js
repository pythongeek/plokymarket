const { Client } = require('pg');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function verifyFlow() {
    try {
        await client.connect();
        console.log('Connected to DB for verification.');

        // 1. Verify View exists
        const viewRes = await client.query("SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'view_resolvable_events')");
        console.log('1. view_resolvable_events exists:', viewRes.rows[0].exists);

        // 2. Verify RPC exists
        const rpcRes = await client.query("SELECT EXISTS (SELECT FROM pg_proc WHERE proname = 'resolve_market')");
        console.log('2. RPC resolve_market exists:', rpcRes.rows[0].exists);

        // 3. Find a test event that is not resolved
        const eventRes = await client.query("SELECT id, question, ends_at, resolution_delay FROM events WHERE trading_status = 'active' LIMIT 1");
        if (eventRes.rows.length > 0) {
            const event = eventRes.rows[0];
            console.log('3. Test event found:', event.question);

            // Calculate if it's "resolvable" per our new logic
            const endsAt = new Date(event.ends_at);
            const availableAt = new Date(endsAt.getTime() + event.resolution_delay * 60000);
            const now = new Date();
            console.log(`   - Ends At: ${endsAt.toISOString()}`);
            console.log(`   - Available At: ${availableAt.toISOString()}`);
            console.log(`   - Current Time: ${now.toISOString()}`);
            console.log(`   - Is Ready: ${now > availableAt}`);
        } else {
            console.log('3. No active events found for testing.');
        }

        // 4. Check for oracle indicators
        const oracleRes = await client.query("SELECT COUNT(*) FROM oracle_requests");
        console.log('4. Total oracle requests in DB:', oracleRes.rows[0].count);

    } catch (err) {
        console.error('Verification failed:', err);
    } finally {
        await client.end();
    }
}

verifyFlow();
