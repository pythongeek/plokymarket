#!/usr/bin/env tsx
/**
 * PLOKY SIMULATOR — PRE-FLIGHT CHECK
 * Run this BEFORE the full simulation to validate connectivity & schema
 */

import { createClient } from '@supabase/supabase-js';

const URL = process.env.SUPABASE_URL || '';
const KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

console.log('🔍 Ploky Simulator Pre-Flight Check\n');

// 1. ENV validation
if (!URL) {
  console.error('❌ SUPABASE_URL is missing');
  process.exit(1);
}
if (!KEY) {
  console.error('❌ SUPABASE_SERVICE_ROLE_KEY is missing');
  console.error('   Get it from: Supabase Dashboard → Project Settings → API → service_role key');
  process.exit(1);
}

console.log(`✅ Environment variables present`);
console.log(`   URL: ${URL.slice(0, 30)}...`);
console.log(`   KEY: ${KEY.slice(0, 15)}... (${KEY.length} chars)\n`);

const supabase = createClient(URL, KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

async function check() {
  let ok = true;

  // 2. Auth admin access
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers({ perPage: 1 });
    if (error) throw error;
    console.log(`✅ Auth Admin API reachable (${users.users.length} sample user(s) found)`);
  } catch (err: any) {
    console.error(`❌ Auth Admin API failed: ${err.message}`);
    console.error(`   Hint: If self-hosted, ensure SUPABASE_URL points to the API gateway (e.g., http://localhost:8000)`);
    ok = false;
  }

  // 3. Database connectivity
  try {
    const { error } = await supabase.from('markets').select('count', { count: 'exact', head: true });
    if (error) throw error;
    console.log(`✅ Database (markets table) reachable`);
  } catch (err: any) {
    console.error(`❌ Database unreachable: ${err.message}`);
    ok = false;
  }

  // 4. Wallets table schema probe
  try {
    const { data, error } = await supabase.from('wallets').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      console.log(`✅ Wallets table found — columns: ${cols.join(', ')}`);
      if (cols.includes('available_balance')) {
        console.log(`   → Schema variant: available_balance + locked_balance`);
      } else if (cols.includes('balance')) {
        console.log(`   → Schema variant: balance`);
      }
    } else {
      console.log(`⚠️ Wallets table exists but is empty (expected for fresh DB)`);
    }
  } catch (err: any) {
    console.error(`❌ Wallets table error: ${err.message}`);
    ok = false;
  }

  // 5. Orders table schema probe
  try {
    const { data, error } = await supabase.from('orders').select('*').limit(1);
    if (error) throw error;
    if (data && data.length > 0) {
      const cols = Object.keys(data[0]);
      console.log(`✅ Orders table found — columns: ${cols.slice(0, 8).join(', ')}${cols.length > 8 ? '...' : ''}`);
    } else {
      console.log(`⚠️ Orders table exists but is empty`);
    }
  } catch (err: any) {
    console.error(`❌ Orders table error: ${err.message}`);
    ok = false;
  }

  // 6. RPC functions probe
  const functions = ['match_order', 'settle_market'];
  for (const fn of functions) {
    try {
      const { error } = await supabase.rpc(fn, {});
      // We expect an error (wrong params), but not "function does not exist"
      if (error && error.message.includes('does not exist')) {
        console.error(`❌ Function ${fn}() does NOT exist in database`);
        ok = false;
      } else {
        console.log(`✅ Function ${fn}() exists (signature mismatch expected for empty params)`);
      }
    } catch (err: any) {
      console.error(`❌ Function ${fn}() check failed: ${err.message}`);
      ok = false;
    }
  }

  // 7. Final verdict
  console.log(`\n${'='.repeat(50)}`);
  if (ok) {
    console.log('🚀 PRE-FLIGHT PASSED — Ready for simulation');
    console.log(`   Run: npx tsx ploky-simulator.ts`);
    process.exit(0);
  } else {
    console.log('⛔ PRE-FLIGHT FAILED — Fix issues above before running simulation');
    process.exit(1);
  }
}

check();
