/**
 * Test Event Creation API
 * Run: node test_event_creation.js
 */

const SUPABASE_URL = 'https://sltcfmqefujecqfbmkvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFldnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzAxNTY3NjAsImV4cCI6MjA4NTczMjc2MH0._g4OI7XhlXQ0SwH0RqZ6hyHCEc5O8H1C9ns-q_rYYxE';

// Admin credentials
const ADMIN_EMAIL = 'admin@plokymarket.bd';
const ADMIN_PASSWORD = 'PlokyAdmin2026!';

async function login() {
  console.log('🔐 Logging in as admin...');
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_ANON_KEY,
    },
    body: JSON.stringify({
      email: ADMIN_EMAIL,
      password: ADMIN_PASSWORD,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(`Login failed: ${data.message || data.error_description}`);
  }
  console.log('✅ Login successful');
  return data.access_token;
}

async function createEvent(token) {
  console.log('\n📝 Creating test event...');
  
  const eventData = {
    title: 'বাংলাদেশ vs ভারত - টি২০ সিরিজ বিজয়ী ২০২৬',
    question: 'বাংলাদেশ বনাম ভারত টি-২০ সিরিজে কোন দল জয়ী হবে?',
    description: 'আগামী বাংলাদেশ-ভারত টি-২০ ক্রিকেট সিরিজের ফলাফল ভবিষ্যদ্বাণী করুন।',
    category: 'sports',
    subcategory: 'cricket',
    trading_closes_at: '2026-03-20T23:59:00Z',
    resolution_method: 'manual_admin',
    answer1: 'বাংলাদেশ জয়ী হবে',
    answer2: 'ভারত জয়ী হবে',
    initial_liquidity: 10000,
    is_featured: true,
  };

  const response = await fetch('https://polymarket-bangladesh.vercel.app/api/admin/events/create', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(eventData),
  });

  const data = await response.json();
  console.log('Response status:', response.status);
  console.log('Response:', JSON.stringify(data, null, 2));
  
  return data;
}

async function main() {
  try {
    const token = await login();
    const result = await createEvent(token);
    
    if (result.success) {
      console.log('\n✅ Event created successfully!');
      console.log('Event ID:', result.event_id);
      console.log('Market ID:', result.market_id);
    } else {
      console.log('\n❌ Event creation failed:', result.error);
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
  }
}

main();
