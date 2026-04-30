#!/usr/bin/env node
/**
 * Populate Leaderboard Mock Data Script
 * 
 * This script provides instructions for executing the SQL migration
 * to populate realistic mock data for testing the leaderboard functionality.
 * 
 * Usage:
 *   node scripts/populate-leaderboard-data.js
 */

const fs = require('fs');
const path = require('path');

console.log('🏆 Leaderboard Mock Data Population Helper\n');
console.log('============================================\n');

const sqlPath = path.join(__dirname, '..', 'supabase', 'migrations', '029_leaderboard_mock_data.sql');

// Check if SQL file exists
if (!fs.existsSync(sqlPath)) {
  console.error('❌ SQL file not found:', sqlPath);
  process.exit(1);
}

const sqlContent = fs.readFileSync(sqlPath, 'utf-8');
console.log('✅ SQL file found:', sqlPath);
console.log(`   Size: ${(sqlContent.length / 1024).toFixed(2)} KB\n`);

console.log('📋 To populate the leaderboard data, follow these steps:\n');

console.log('Method 1: Using Supabase Dashboard (Recommended)');
console.log('------------------------------------------------');
console.log('1. Go to https://app.supabase.com');
console.log('2. Select your project (sltcfmqefujecqfbmkvz)');
console.log('3. Click "SQL Editor" in the left sidebar');
console.log('4. Click "New Query"');
console.log('5. Open the file: supabase/migrations/029_leaderboard_mock_data.sql');
console.log('6. Copy the entire SQL content');
console.log('7. Paste into the SQL Editor');
console.log('8. Click "Run"\n');

console.log('Method 2: Using psql CLI');
console.log('-------------------------');
console.log('psql "postgres://postgres.sltcfmqefujecqfbmkvz:01oTLBmI4U2IA6Dx@aws-1-us-east-1.pooler.supabase.com:6543/postgres" -f supabase/migrations/029_leaderboard_mock_data.sql\n');

console.log('📊 What this migration creates:');
console.log('--------------------------------');
console.log('• 50 realistic Bangladeshi traders');
console.log('• 7 resolved markets (for P&L calculation)');
console.log('• 60+ positions with various profit/loss amounts');
console.log('• 100+ trade records for volume calculations');
console.log('• Leaderboard cache entries for all timeframes (daily, weekly, monthly, all_time)');
console.log('• League assignments (Bronze, Silver, Gold, Platinum, Diamond)');
console.log('• Badge assignments (Whale, Sniper, Streak Master, etc.)\n');

console.log('🌐 After running the migration, visit:');
console.log('   https://polymarket-bangladesh.vercel.app/leaderboard\n');

console.log('✨ Verification SQL (run in Supabase SQL Editor):');
console.log('--------------------------------------------------');
console.log(`SELECT 
  (SELECT COUNT(*) FROM users) as total_users,
  (SELECT COUNT(*) FROM positions) as total_positions,
  (SELECT COUNT(*) FROM leaderboard_cache) as leaderboard_entries,
  (SELECT COUNT(*) FROM user_leagues) as league_assignments,
  (SELECT COUNT(*) FROM user_badges) as badges_awarded;\n`);
