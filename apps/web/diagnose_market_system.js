const https = require('https');

const SUPABASE_URL = 'https://sltcfmqefujecqfbmkvz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE';

async function checkTable(tableName, query = '') {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'sltcfmqefujecqfbmkvz.supabase.co',
            path: '/rest/v1/' + tableName + '?select=*&limit=5' + (query ? '&' + query : ''),
            method: 'GET',
            headers: {
                'apikey': ANON_KEY,
                'Authorization': 'Bearer ' + ANON_KEY
            }
        }, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (Array.isArray(parsed)) {
                        resolve({ status: res.statusCode, count: parsed.length, data: parsed });
                    } else {
                        resolve({ status: res.statusCode, error: parsed });
                    }
                } catch (e) {
                    resolve({ status: res.statusCode, error: data });
                }
            });
        });
        req.on('error', (e) => resolve({ error: e.message }));
        req.end();
    });
}

async function main() {
    console.log('=== MARKET SYSTEM DIAGNOSTIC ===\n');

    // 1. Check core tables
    console.log('📊 CORE TABLES:');
    const tables = ['markets', 'events', 'orders', 'trades', 'positions', 'wallets'];

    for (const table of tables) {
        const result = await checkTable(table);
        if (result.error && result.error.code === '42P01') {
            console.log(`  ❌ ${table}: TABLE NOT FOUND`);
        } else if (result.status === 200) {
            console.log(`  ✅ ${table}: ${result.count} records`);
        } else {
            console.log(`  ⚠️  ${table}: Status ${result.status}`);
        }
    }

    // 2. Check Phase 2 tables
    console.log('\n📋 PHASE 2 TABLES:');
    const phase2Tables = ['outcomes', 'user_bookmarks', 'market_followers', 'price_history', 'notifications', 'order_batches'];

    for (const table of phase2Tables) {
        const result = await checkTable(table);
        if (result.error && result.error.code === '42P01') {
            console.log(`  ❌ ${table}: TABLE NOT FOUND`);
        } else if (result.status === 200) {
            console.log(`  ✅ ${table}: ${result.count} records`);
        } else {
            console.log(`  ⚠️  ${table}: Status ${result.status}`);
        }
    }

    // 3. Check sample market data
    console.log('\n🏪 SAMPLE MARKET DATA:');
    const marketResult = await checkTable('markets', 'status=eq.active&limit=3');
    if (marketResult.status === 200 && marketResult.count > 0) {
        marketResult.data.forEach(m => {
            console.log(`  - ${m.question?.substring(0, 50)}... (status: ${m.status}, yes_price: ${m.yes_price})`);
        });
    } else {
        console.log('  ⚠️  No active markets found');
    }

    // 4. Check market columns
    console.log('\n📝 MARKET COLUMNS CHECK:');
    const marketCols = ['market_type', 'yes_price_change_24h', 'risk_score', 'stages_completed', 'current_stage'];
    for (const col of marketCols) {
        const result = await checkTable('markets', `${col}=not.is.null&limit=1`);
        if (result.status === 200 && result.count > 0) {
            console.log(`  ✅ ${col}: EXISTS`);
        } else {
            console.log(`  ❌ ${col}: MISSING OR EMPTY`);
        }
    }

    console.log('\n=== DIAG COMPLETE ===');
}

main().catch(console.error);
