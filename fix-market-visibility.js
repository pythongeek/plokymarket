/**
 * Fix Market Visibility Issue
 * Diagnose why market page shows 404 when market exists in database
 */

const https = require('https');

const config = {
  supabaseUrl: 'https://sltcfmqefujecqfbmkvz.supabase.co',
  supabaseKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE',
  marketId: '2698853e-f9fc-48d4-b9c9-d8663a929a93'
};

async function testMarketAccess() {
  console.log('🔍 Testing Market Visibility Issue\n');

  const tests = [
    {
      name: 'Direct REST API',
      endpoint: `/rest/v1/markets?id=eq.${config.marketId}&select=*`,
      expected: 'Should return market data'
    },
    {
      name: 'Slug Lookup',
      endpoint: `/rest/v1/markets?slug=eq.plokymarket-users-15k-2026&select=*`,
      expected: 'Should find market by slug'
    },
    {
      name: 'List All Markets',
      endpoint: `/rest/v1/markets?status=eq.active&limit=10&select=id,question,status`,
      expected: 'Should list active markets'
    }
  ];

  for (const test of tests) {
    console.log(`📊 Test: ${test.name}`);
    console.log(`   Expected: ${test.expected}`);
    
    try {
      const result = await fetch(`${config.supabaseUrl}${test.endpoint}`, {
        headers: { 'apikey': config.supabaseKey }
      }).then(r => r.json());

      if (Array.isArray(result) && result.length > 0) {
        console.log(`   ✅ Result: Found ${result.length} item(s)`);
        if (test.name === 'Direct REST API') {
          console.log(`      - ID: ${result[0].id}`);
          console.log(`      - Status: ${result[0].status}`);
          console.log(`      - Slug: ${result[0].slug}`);
        }
      } else if (result.message) {
        console.log(`   ⚠️  Error: ${result.message}`);
      } else {
        console.log(`   ℹ️  No results`);
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
    }
    
    console.log();
  }

  console.log('\n💡 Possible Fixes:\n');
  console.log('1. Clear browser cache: DevTools → Application → Clear Site Data');
  console.log('2. Check RLS: Supabase Dashboard → Authentication → Policies (should allow SELECT)');
  console.log('3. Check Frontend: Look for market ID in URL vs slug mismatch');
  console.log('4. Verify Status: Market status should be "active" not "pending"');
  console.log('5. Hard Refresh: Ctrl+Shift+R (bypass cache)\n');
}

testMarketAccess();
