/**
 * E2E Test Script for Market Flow
 * Tests: Create Event → Seed Liquidity → Place Atomic Order
 * 
 * Usage: npx tsx scripts/test-market-flow.ts
 */

import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ Missing Supabase environment variables');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

interface TestResult {
    step: string;
    status: 'success' | 'error' | 'warning';
    message: string;
    data?: any;
}

async function runSystemTest(): Promise<void> {
    console.log('🛠 Starting E2E Market Flow Test...\n');
    const results: TestResult[] = [];

    try {
        // Step 1: Create or get a test event
        console.log('📝 Step 1: Checking for active test event...');

        const { data: events, error: eventsError } = await supabase
            .from('events')
            .select('id, title, status, initial_liquidity')
            .eq('status', 'active')
            .limit(1);

        if (eventsError) {
            results.push({
                step: 'Fetch Events',
                status: 'error',
                message: eventsError.message
            });
            console.error('❌ Error fetching events:', eventsError);
        } else if (events && events.length > 0) {
            const testEvent = events[0];
            results.push({
                step: 'Fetch Events',
                status: 'success',
                message: `Found active event: ${testEvent.title}`,
                data: testEvent
            });
            console.log(`✅ Found active event: ${testEvent.title} (${testEvent.id})`);

            // Step 2: Seed initial liquidity
            console.log('\n💧 Step 2: Seeding initial liquidity...');

            const { data: seedResult, error: seedError } = await supabase.rpc('seed_initial_liquidity', {
                p_event_id: testEvent.id,
                p_initial_price: 0.5,
                p_liquidity: 1000
            });

            if (seedError) {
                results.push({
                    step: 'Seed Liquidity',
                    status: 'error',
                    message: seedError.message
                });
                console.error('❌ Seeding failed:', seedError);
            } else {
                results.push({
                    step: 'Seed Liquidity',
                    status: seedResult?.status === 'success' ? 'success' : 'warning',
                    message: seedResult?.message || 'Liquidity seeded',
                    data: seedResult
                });
                console.log(`✅ Liquidity seeded:`, seedResult);
            }

            // Step 3: Place atomic order
            console.log('\n📊 Step 3: Placing atomic order...');

            // Get current user (first authenticated user for testing)
            const { data: { user } } = await supabase.auth.getUser();

            if (!user) {
                results.push({
                    step: 'Place Order',
                    status: 'error',
                    message: 'No authenticated user found. Please login first.'
                });
                console.error('❌ No authenticated user. Please login to test.');
            } else {
                const { data: orderResult, error: orderError } = await supabase.rpc('place_order_atomic', {
                    p_user_id: user.id,
                    p_market_id: testEvent.id,
                    p_side: 'YES',
                    p_amount: 10,
                    p_price: 0.5
                });

                if (orderError) {
                    results.push({
                        step: 'Place Order',
                        status: 'error',
                        message: orderError.message
                    });
                    console.error('❌ Order failed:', orderError);
                } else {
                    results.push({
                        step: 'Place Order',
                        status: orderResult?.status === 'success' ? 'success' : 'error',
                        message: orderResult?.message || 'Order placed',
                        data: orderResult
                    });
                    console.log(`✅ Order placed:`, orderResult);
                }
            }

        } else {
            results.push({
                step: 'Fetch Events',
                status: 'warning',
                message: 'No active events found. Creating a test event...'
            });
            console.log('⚠️ No active events found. Creating test event...');

            // Create a test event
            const { data: newEvent, error: createError } = await supabase
                .from('events')
                .insert({
                    title: 'Test Event - E2E ' + new Date().toISOString(),
                    description: 'E2E test event',
                    category: 'test',
                    status: 'active',
                    initial_liquidity: 1000,
                    end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
                })
                .select()
                .single();

            if (createError) {
                results.push({
                    step: 'Create Event',
                    status: 'error',
                    message: createError.message
                });
                console.error('❌ Event creation failed:', createError);
            } else {
                results.push({
                    step: 'Create Event',
                    status: 'success',
                    message: 'Test event created',
                    data: newEvent
                });
                console.log(`✅ Test event created:`, newEvent.id);
            }
        }

        // Print summary
        console.log('\n' + '='.repeat(50));
        console.log('📋 TEST SUMMARY');
        console.log('='.repeat(50));

        results.forEach(result => {
            const icon = result.status === 'success' ? '✅' : result.status === 'warning' ? '⚠️' : '❌';
            console.log(`${icon} ${result.step}: ${result.message}`);
        });

        const successCount = results.filter(r => r.status === 'success').length;
        const errorCount = results.filter(r => r.status === 'error').length;

        console.log('\n' + '='.repeat(50));
        console.log(`📊 Results: ${successCount} passed, ${errorCount} failed, ${results.length - successCount - errorCount} warnings`);
        console.log('='.repeat(50));

        if (errorCount > 0) {
            console.log('\n❌ E2E Test FAILED');
            process.exit(1);
        } else {
            console.log('\n✅ E2E Test PASSED');
            process.exit(0);
        }

    } catch (error: any) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

// Run the test
runSystemTest();
