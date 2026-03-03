const https = require('https');
const fs = require('fs');

// Read SQL file
const sql = fs.readFileSync('./add_admin_market_columns.sql', 'utf8');

// Supabase credentials
const SUPABASE_URL = 'https://sltcfmqefujecqfbmkvz.supabase.co';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDE1Njc2MCwiZXhwIjoyMDg1NzMyNzYwfQ.EJ9oQvhR2K-VPFDqlD3M3qJNuyW1U3rK6z6zK6zK6zK';

function executeSQL(sqlCommands) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify({ query: sqlCommands });

        const options = {
            hostname: 'sltcfmqefujecqfbmkvz.supabase.co',
            path: '/rest/v1/rpc/exec_sql',
            method: 'POST',
            headers: {
                'apikey': SERVICE_KEY,
                'Authorization': 'Bearer ' + SERVICE_KEY,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    resolve(parsed);
                } catch (e) {
                    resolve({ raw: data });
                }
            });
        });

        req.on('error', reject);
        req.write(postData);
        req.end();
    });
}

// Try using pg_catalog to execute
async function main() {
    console.log('Attempting to add admin market columns...\n');

    // Since we can't directly execute SQL via REST, let's check if we can use the API
    // Instead, we'll document what needs to be done

    console.log('Migration SQL prepared:');
    console.log('- risk_score: INT DEFAULT 0');
    console.log('- stages_completed: TEXT[] DEFAULT \'{}\'');
    console.log('- current_stage: VARCHAR(50)');
    console.log('- trading_closes_at: TIMESTAMP WITH TIME ZONE');
    console.log('- initial_liquidity: DECIMAL(18,2)');
    console.log('- trading_fee_percent: DECIMAL(5,2)');
    console.log('- liquidity: DECIMAL(18,2)');
    console.log('- total_volume: DECIMAL(18,2)');
    console.log('- winning_outcome: VARCHAR(50)');
    console.log('- confidence: INT DEFAULT 0');
    console.log('- trader_count: INT DEFAULT 0');
    console.log('- event_date: DATE');

    console.log('\nTo apply this migration:');
    console.log('1. Go to Supabase Dashboard > SQL Editor');
    console.log('2. Copy and run add_admin_market_columns.sql');
    console.log('\nAlternatively, you can use the admin API endpoint:');
    console.log('POST /api/admin/run-migration with the SQL content');
}

main();
