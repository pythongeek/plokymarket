const https = require('https');

const SUPABASE_URL = 'https://sltcfmqefujecqfbmkvz.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE';

async function checkBasicColumns() {
    return new Promise((resolve) => {
        const req = https.request({
            hostname: 'sltcfmqefujecqfbmkvz.supabase.co',
            path: '/rest/v1/markets?select=id,question,status,yes_price,no_price,market_type&limit=1',
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
                        resolve({ status: res.statusCode, data: parsed });
                    } else {
                        resolve({ status: res.statusCode, error: parsed });
                    }
                } catch (e) {
                    resolve({ status: res.statusCode, raw: data });
                }
            });
        });
        req.on('error', (e) => resolve({ error: e.message }));
        req.end();
    });
}

async function main() {
    console.log('=== Checking Existing Market Columns ===\n');

    const result = await checkBasicColumns();

    if (result.error) {
        console.log('Error:', JSON.stringify(result.error, null, 2));
        return;
    }

    console.log('Status:', result.status);
    console.log('Data:', JSON.stringify(result.data, null, 2));
}

main();
