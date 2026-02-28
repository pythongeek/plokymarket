#!/usr/bin/env node
/**
 * Debug script to test event creation API
 * This helps identify if the issue is in the database or frontend
 */

const { createClient } = require('@supabase/supabase-js');

// Configuration - Update these with your Supabase credentials
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

async function debugEventCreation() {
    console.log('🔧 Debugging Event Creation\n');
    
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY || 
        SUPABASE_URL === 'https://your-project.supabase.co' ||
        SUPABASE_SERVICE_ROLE_KEY === 'your-service-role-key') {
        console.error('❌ Error: Please set your Supabase credentials');
        console.log('\nSet environment variables:');
        console.log('  export NEXT_PUBLIC_SUPABASE_URL=your-url');
        console.log('  export SUPABASE_SERVICE_ROLE_KEY=your-key\n');
        process.exit(1);
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
        auth: { persistSession: false }
    });

    try {
        // Step 1: Test basic event insertion
        console.log('Step 1: Testing basic event insertion...');
        const { data: testResult, error: testError } = await supabase.rpc('test_event_creation');
        
        if (testError) {
            console.error('❌ Basic insertion test FAILED:', testError.message);
        } else {
            console.log('✅ Basic insertion test result:', testResult);
        }
        console.log('');

        // Step 2: Check if create_event_complete exists
        console.log('Step 2: Checking if create_event_complete function exists...');
        const { data: funcCheck, error: funcError } = await supabase
            .from('pg_proc')
            .select('proname')
            .eq('proname', 'create_event_complete')
            .single();
        
        if (funcError) {
            console.log('⚠️  Could not check function:', funcError.message);
        } else if (funcCheck) {
            console.log('✅ create_event_complete function exists');
        } else {
            console.log('❌ create_event_complete function DOES NOT exist');
        }
        console.log('');

        // Step 3: Get an admin user ID
        console.log('Step 3: Finding admin user...');
        const { data: adminUser, error: adminError } = await supabase
            .from('user_profiles')
            .select('id, email, is_admin')
            .eq('is_admin', true)
            .limit(1)
            .single();
        
        if (adminError || !adminUser) {
            console.error('❌ No admin user found:', adminError?.message);
            process.exit(1);
        }
        console.log('✅ Found admin user:', adminUser.email, '(ID:', adminUser.id + ')');
        console.log('');

        // Step 4: Try to create an event using create_event_debug
        console.log('Step 4: Testing create_event_debug function...');
        const eventData = {
            title: 'Debug Test Event ' + new Date().toISOString(),
            question: 'Will this debug test work?',
            description: 'This is a test event for debugging',
            category: 'sports',
            subcategory: 'ক্রিকেট (Cricket)',
            trading_closes_at: '2026-03-15T18:00:00Z',
            resolution_method: 'manual_admin',
            resolution_delay_hours: 24,
            initial_liquidity: 1000,
            is_featured: true
        };
        
        const { data: debugResult, error: debugError } = await supabase.rpc('create_event_debug', {
            p_event_data: eventData,
            p_admin_id: adminUser.id
        });
        
        if (debugError) {
            console.error('❌ create_event_debug FAILED:', debugError.message);
        } else {
            console.log('✅ create_event_debug result:', debugResult);
        }
        console.log('');

        // Step 5: Try to create an event using create_event_complete
        console.log('Step 5: Testing create_event_complete function...');
        const { data: completeResult, error: completeError } = await supabase.rpc('create_event_complete', {
            p_event_data: eventData,
            p_admin_id: adminUser.id
        });
        
        if (completeError) {
            console.error('❌ create_event_complete FAILED:', completeError.message);
            console.log('This is likely the error causing the silent failure in the admin panel.');
        } else {
            console.log('✅ create_event_complete result:', completeResult);
        }
        console.log('');

        // Step 6: Check current events count
        console.log('Step 6: Checking current events count...');
        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, status, created_at')
            .order('created_at', { ascending: false })
            .limit(5);
        
        if (eventsError) {
            console.error('❌ Could not fetch events:', eventsError.message);
        } else {
            console.log(`✅ Found ${events?.length || 0} events`);
            if (events && events.length > 0) {
                events.forEach(e => {
                    console.log(`   - ${e.title} (${e.status})`);
                });
            }
        }
        console.log('');

        // Step 7: Check for any events created in the last 5 minutes
        console.log('Step 7: Checking for recently created events...');
        const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
        const { data: recentEvents, error: recentError } = await supabase
            .from('events')
            .select('id, title, created_at')
            .gte('created_at', fiveMinutesAgo);
        
        if (recentError) {
            console.error('❌ Could not fetch recent events:', recentError.message);
        } else if (recentEvents && recentEvents.length > 0) {
            console.log(`✅ Found ${recentEvents.length} events created in the last 5 minutes:`);
            recentEvents.forEach(e => {
                console.log(`   - ${e.title}`);
            });
        } else {
            console.log('ℹ️  No events created in the last 5 minutes');
        }

    } catch (err) {
        console.error('\n❌ Unexpected error:', err.message);
    }
}

// Run the debug script
debugEventCreation();
