const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

const connectionString = "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres?sslmode=require&supa=base-pooler.x";

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

const migrations = [
    '100_fix_event_schema_and_rls.sql',
    '101_spec_alignment_patch.sql',
    '102_market_admin_fields.sql',
    '103_mfs_deposit_support.sql',
    '104_market_spec_compliance.sql',
    '105_comments_and_resolvers.sql',
    '106_event_validation_and_realtime.sql',
    '115_emergency_pause_system.sql',
    '116_resolution_interface.sql',
    '117_market_metrics.sql',
    '118_clob_industry_standard.sql',
    '119_events_realtime_rls.sql',
    '119_secure_atomic_wallet_updates.sql',
    '120_performance_indexes.sql',
    '121_system_hardening_indexes.sql',
    '121_system_hardening_wallets.sql',
    '123_create_event_with_markets_rpc.sql',
    '123_phase2_multi_outcome_markets.sql',
    '123_withdrawal_api_support.sql',
    '124_phase2_social_layer.sql',
    '125_phase2_price_history_analytics.sql',
    '126_phase2_notification_system.sql',
    '127_phase2_batch_orders.sql',
    '20260225_add_resolution_delay_to_events.sql'
];

async function runMigrations() {
    try {
        await client.connect();
        console.log('Connected to Production DB.');

        await client.query('SET search_path TO public, extensions');

        for (const migration of migrations) {
            console.log(`Applying ${migration}...`);
            const sqlPath = path.join(__dirname, 'supabase', 'migrations', migration);
            if (!fs.existsSync(sqlPath)) {
                console.error(`File not found: ${sqlPath}`);
                continue;
            }
            const sql = fs.readFileSync(sqlPath, 'utf8');

            // Try applying the whole file first
            try {
                await client.query(sql);
                console.log(`✅ ${migration} applied.`);
            } catch (err) {
                console.error(`❌ Migration ${migration} failed:`, err.message);
                console.error(`Detail:`, err.detail);
                console.error(`Hint:`, err.hint);
                console.error(`Where:`, err.where);

                if (migration === '001_usdt_schema.sql') {
                    console.log('Attempting to apply 001 line by line (crude split)...');
                    const statements = sql.split(';');
                    for (let s of statements) {
                        s = s.trim();
                        if (!s) continue;
                        try {
                            await client.query(s);
                        } catch (sErr) {
                            if (!sErr.message.includes('already exists')) {
                                console.error(`Statement failed: ${s.substring(0, 50)}...`);
                                console.error(`Error: ${sErr.message}`);
                            }
                        }
                    }
                    console.log('Finished crude line-by-line for 001.');
                } else {
                    throw err; // For others, just stop
                }
            }
        }

    } catch (err) {
        console.error('Migration framework failed:', err);
    } finally {
        await client.end();
    }
}

runMigrations();
