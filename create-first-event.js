#!/usr/bin/env node

/**
 * Create First Test Event for Plokymarket
 * This script creates a test event directly using Supabase REST API
 */

const https = require('https');
const querystring = require('querystring');

const config = {
  supabaseUrl: 'https://sltcfmqefujecqfbmkvz.supabase.co',
  supabaseAnonKey: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE',
  jwtSecret: 'UmecMMJmClwC6i7F6vbkOWn5Y1Jo45ryVPgxCd5qQl+EX6YwbvtO7so5o3IOmbo4paOH9V69+8FlIl6lBCjrxw==',
  adminEmail: 'admin@plokymarket.bd',
  adminPassword: 'PlokyAdmin2026!'
};

// Create test event payload
const createTestEvent = () => ({
  event_data: {
    name: 'প্লোকিমার্কেট ব্যবহারকারী বৃদ্ধি',
    question: 'Will Plokymarket users exceed 15,000 by December 2026?',
    description: 'Test event measuring platform growth milestones',
    category: 'Technology',
    subcategory: 'Platform Growth',
    tags: ['plokymarket', 'platform', 'growth', 'test'],
    trading_closes_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
    resolution_delay_hours: 24,
    initial_liquidity: 10000,
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    answer1: 'হ্যাঁ (YES)',
    answer2: 'না (NO)',
    slug: 'plokymarket-users-15k-2026',
    is_featured: true
  },
  resolution_config: {
    primary_method: 'ai_oracle',
    ai_keywords: ['Plokymarket', 'users', 'growth', 'platform'],
    ai_sources: ['plokymarket.bd'],
    confidence_threshold: 85
  }
});

// Fetch admin token via Supabase Auth
async function getAdminToken() {
  return new Promise((resolve, reject) => {
    const authPayload = JSON.stringify({
      email: config.adminEmail,
      password: config.adminPassword,
      gotrue_meta_security: {}
    });

    const url = new URL(`${config.supabaseUrl}/auth/v1/token?grant_type=password`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(authPayload),
        'apikey': config.supabaseAnonKey
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(data);
            resolve(parsed.access_token);
          } catch (e) {
            reject(new Error(`Failed to parse auth response: ${e.message}`));
          }
        } else {
          reject(new Error(`Auth failed (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(authPayload);
    req.end();
  });
}

// Create event via Supabase REST API
async function createEvent(token) {
  const now = new Date();
  const tradingCloses = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 30 days from now
  const eventDate = new Date(tradingCloses.getTime() + 24 * 60 * 60 * 1000); // 1 day after trading closes

  const eventPayload = {
    question: 'Will Plokymarket users exceed 15,000 by December 2026?',
    description: 'Test event measuring platform growth milestones',
    category: 'Technology',
    subcategory: 'Platform Growth',
    tags: ['plokymarket', 'platform', 'growth', 'test'],
    trading_closes_at: tradingCloses.toISOString(),
    event_date: eventDate.toISOString(),
    resolution_delay_hours: 24,
    initial_liquidity: 10000,
    image_url: 'https://images.unsplash.com/photo-1552664730-d307ca884978?w=400&h=300&fit=crop',
    answer1: 'হ্যাঁ (YES)',
    answer2: 'না (NO)',
    answer_type: 'binary',
    status: 'active',
    slug: 'plokymarket-users-15k-2026-v2',
    is_featured: true
  };

  const payload = JSON.stringify(eventPayload);

  return new Promise((resolve, reject) => {
    const url = new URL(`${config.supabaseUrl}/rest/v1/markets`);
    const options = {
      hostname: url.hostname,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'Authorization': `Bearer ${token}`,
        'apikey': config.supabaseAnonKey,
        'Prefer': 'return=representation'
      }
    };

    const req = https.request(options, (res) => {
      let data = '';
      res.on('data', chunk => (data += chunk));
      res.on('end', () => {
        if (res.statusCode === 201 || res.statusCode === 200) {
          try {
            const parsed = Array.isArray(JSON.parse(data)) ? JSON.parse(data)[0] : JSON.parse(data);
            resolve(parsed);
          } catch (e) {
            reject(new Error(`Failed to parse response: ${e.message}`));
          }
        } else {
          reject(new Error(`Event creation failed (${res.statusCode}): ${data}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

// Main execution
async function main() {
  console.log('🚀 Plokymarket - First Event Creation\n');
  console.log('Authenticating admin user...');

  try {
    const token = await getAdminToken();
    console.log('✅ Admin authenticated\n');

    console.log('Creating test event...');
    const result = await createEvent(token);

    console.log('✅ Event created successfully!\n');
    console.log('📊 Event Details:');
    console.log(`   Event ID: ${result.id}`);
    console.log(`   Status: ${result.status} (awaiting admin approval)`);
    console.log(`   Question: Will Plokymarket users exceed 15,000 by December 2026?`);
    console.log(`   Category: ${result.category}`);
    console.log(`   Initial Liquidity: ৳${result.liquidity}`);
    console.log(`   Trading Closes: ${new Date(result.trading_closes_at).toLocaleString('bn-BD')}\n`);

    console.log('🔗 View Event:');
    console.log(`   https://polymarket-bangladesh.vercel.app/markets/${result.id}\n`);

    console.log('✨ Next Steps:');
    console.log('   1. ✅ Event created successfully');
    console.log('   2. Log in to admin panel: https://polymarket-bangladesh.vercel.app/auth-portal-3m5n8');
    console.log('   3. Approve the event to make it active');
    console.log('   4. Execute test trades on the market');
    console.log('   5. Monitor order matching and settlement\n');

  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

main();
