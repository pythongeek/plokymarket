/**
 * Direct API test to debug the 500 error from event creation.
 * This makes the same call the frontend makes, but lets us see the full error.
 */
const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://sltcfmqefujecqfbmkvz.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InNsdGNmbXFlZnVqZWNxZmJta3Z6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Mzg1OTQ2MTYsImV4cCI6MjA1NDE3MDYxNn0.VUPaVVPq4k2i0YxS4sS5HDT4-hYinaVPZ6rpBM5HWf4';
const API_URL = 'https://polymarket-bangladesh.vercel.app/api/admin/events/create';

async function test() {
    // First, login to get a token
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    console.log('1. Logging in as admin...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: 'admin@plokymarket.bd',
        password: 'PlokyAdmin2026!'
    });

    if (authError) {
        console.error('Auth failed:', authError.message);
        return;
    }

    const token = authData.session.access_token;
    console.log('✅ Login successful, got token');

    // Now call the events creation API
    console.log('\n2. Calling event creation API...');
    const payload = {
        event_data: {
            name: 'Test Event: API Debug 2026',
            question: 'Will this event creation API call succeed in production?',
            description: 'Testing the event creation endpoint directly.',
            category: 'technology',
            tags: ['test', 'debug'],
            trading_closes_at: '2026-12-31T23:59:00Z',
            resolution_delay_hours: 24,
            initial_liquidity: 1000,
            answer1: 'Yes',
            answer2: 'No',
            is_featured: false,
            slug: `test-event-${Date.now()}`
        },
        resolution_config: {
            primary_method: 'manual_admin'
        }
    };

    try {
        const response = await fetch(API_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        const responseBody = await response.text();
        console.log(`Status: ${response.status}`);
        console.log(`Response: ${responseBody}`);

        if (response.status !== 200) {
            console.error('\n❌ API FAILED');
            try {
                const parsed = JSON.parse(responseBody);
                console.error('Error:', parsed.error);
                console.error('Details:', parsed.details);
            } catch (e) {
                console.error('Raw response:', responseBody);
            }
        } else {
            console.log('\n✅ EVENT CREATED SUCCESSFULLY!');
        }
    } catch (err) {
        console.error('Fetch error:', err.message);
    }
}

test();
