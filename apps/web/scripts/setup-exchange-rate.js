/**
 * Setup Exchange Rate System
 * Run: npx tsx scripts/setup-exchange-rate.ts
 * Or: node -r esbuild-register scripts/setup-exchange-rate.ts
 */

require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

// Use service role key for admin operations
const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceKey) {
    console.error('Error: Missing SUPABASE_URL or SUPABASE_SECRET_KEY');
    console.log('Available:', Object.keys(process.env).filter(k => k.includes('SUPABASE')));
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function setupExchangeRateSystem() {
    console.log('Setting up exchange rate system...\n');

    // 1. Create tables
    console.log('1. Creating tables...');

    // exchange_rates_live
    const { error: liveError } = await supabase.rpc('pg_catalog.exec_sql', {
        sql_text: `
            CREATE TABLE IF NOT EXISTS exchange_rates_live (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                usdt_to_bdt DECIMAL(10,4) NOT NULL CHECK (usdt_to_bdt > 0),
                bdt_to_usdt DECIMAL(10,4) NOT NULL CHECK (bdt_to_usdt > 0),
                source VARCHAR(50) NOT NULL DEFAULT 'manual',
                source_url TEXT,
                api_response JSONB,
                is_active BOOLEAN DEFAULT true,
                fetched_at TIMESTAMPTZ DEFAULT NOW() NOT NULL,
                expires_at TIMESTAMPTZ DEFAULT (NOW() + INTERVAL '5 minutes'),
                created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
            );
        `
    }).catch(() => ({ error: null })); // Ignore if function doesn't exist

    // We'll create tables via direct table API
    console.log('Note: Tables need to be created via SQL migration');

    // 2. Insert default config
    console.log('\n2. Inserting default config...');

    // Try to insert config
    const { data: configData, error: configError } = await supabase
        .from('exchange_rate_config')
        .upsert({
            id: 1,
            default_usdt_to_bdt: 119.00,
            min_usdt_to_bdt: 95.00,
            max_usdt_to_bdt: 130.00,
            auto_update_enabled: false,
            update_interval_minutes: 5,
            last_updated: new Date().toISOString()
        }, { onConflict: 'id' })
        .select();

    if (configError) {
        console.log('Config error (may need migration):', configError.message);
    } else {
        console.log('✓ Config inserted/updated');
    }

    // 3. Insert initial live rate
    console.log('\n3. Inserting initial live rate...');

    const { data: rateData, error: rateError } = await supabase
        .from('exchange_rates_live')
        .insert({
            usdt_to_bdt: 119.00,
            bdt_to_usdt: 0.0084,
            source: 'default',
            is_active: true,
            expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
        })
        .select()
        .catch(err => {
            console.log('Rate insert error (may need migration):', err.message);
            return { data: null, error: err };
        });

    if (!rateError || rateError?.message?.includes('duplicate')) {
        console.log('✓ Initial rate inserted');
    }

    // 4. Test the RPC function
    console.log('\n4. Testing RPC function...');

    const { data: rpcTest, error: rpcError } = await supabase.rpc('update_exchange_rate', {
        p_usdt_to_bdt: 126.50,
        p_source: 'admin_test'
    }).catch(err => {
        console.log('RPC test error:', err.message);
        return { data: null, error: err };
    });

    if (!rpcError) {
        console.log('✓ RPC function works! Result:', rpcTest);
    }

    // 5. Check current rate
    console.log('\n5. Checking current rate...');

    const { data: currentRate, error: currentError } = await supabase
        .from('exchange_rates_live')
        .select('*')
        .eq('is_active', true)
        .order('fetched_at', { ascending: false })
        .limit(1)
        .single();

    if (!currentError && currentRate) {
        console.log('✓ Current rate:', {
            rate: currentRate.usdt_to_bdt,
            source: currentRate.source,
            fetched: currentRate.fetched_at
        });
    } else {
        console.log('⚠ Could not fetch current rate:', currentError?.message);
    }

    console.log('\n--- Setup Complete ---');
    console.log('If you see errors above, the database migration needs to be applied first.');
    console.log('The migration file is: apps/web/supabase/migrations/20260308000000_exchange_rate_system.sql');
}

setupExchangeRateSystem().catch(console.error);
