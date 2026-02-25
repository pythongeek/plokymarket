/**
 * Demo Event Creation Script
 * Creates a complete event with hybrid resolution
 */

const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://your-project.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-key';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function createDemoEvent() {
  try {
    console.log('Creating demo event with hybrid resolution...\n');

    // 1. Create the event
    const eventData = {
      name: 'BPL 2024 ফাইনাল: কুমিল্লা ভিক্টোরিয়ান্স কি চ্যাম্পিয়ন হবে?',
      question: 'বিপিএল ২০২৪ ফাইনালে কুমিল্লা ভিক্টোরিয়ান্স কি চ্যাম্পিয়ন হবে?',
      description: 'বাংলাদেশ প্রিমিয়ার লিগ (BPL) ২০২৪ এর ফাইনাল ম্যাচ। কুমিল্লা ভিক্টোরিয়ান্স বনাম ফরচুন বরিশাল। ম্যাচটি ০১ মার্চ ২০২৪ তারিখে অনুষ্ঠিত হবে।',
      category: 'sports',
      subcategory: 'ক্রিকেট',
      tags: ['BPL', 'ক্রিকেট', 'বাংলাদেশ', 'T20', 'ফাইনাল'],
      image_url: 'https://images.unsplash.com/photo-1531415074968-036ba1b575da?w=800',
      outcomes: [
        { label: 'হ্যাঁ', color: '#22c55e' },
        { label: 'না', color: '#ef4444' }
      ],
      trading_closes_at: '2024-03-01T14:00:00+06:00',
      resolution_date: '2024-03-01T22:00:00+06:00',
      initial_liquidity: 1000,
      min_bet_amount: 10,
      max_bet_amount: 5000,
      fee_percentage: 2,
      is_featured: true,
      is_private: false,
      slug: 'bpl-2024-final-comilla-champion-' + Date.now(),
      status: 'active',
      created_by: '00000000-0000-0000-0000-000000000000' // System/admin UUID
    };

    const { data: event, error: eventError } = await supabase
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (eventError) {
      console.error('Error creating event:', eventError);
      return;
    }

    console.log('✅ Event created successfully!');
    console.log('Event ID:', event.id);
    console.log('Slug:', event.slug);

    // 2. Create resolution configuration with hybrid method
    const resolutionConfig = {
      event_id: event.id,
      primary_method: 'hybrid',
      ai_keywords: ['BPL', 'Comilla', 'Barisal', 'final', 'champion'],
      ai_sources: ['prothomalo.com', 'espncricinfo.com', 'cricbuzz.com'],
      confidence_threshold: 75,
      resolution_criteria: 'ম্যাচ শেষে আনুষ্ঠানিক ফলাফল অনুযায়ী। সুপার ওভার হলে সেটিও গণ্য হবে।',
      source_urls: ['https://www.espncricinfo.com/series/bpl-2024'],
      hybrid_config: {
        ai_weight: 0.3,
        human_weight: 0.7,
        consensus_threshold: 75,
        min_human_reviewers: 2,
        auto_resolve_if_agreement: true
      }
    };

    const { data: resolution, error: resolutionError } = await supabase
      .from('event_resolution_configs')
      .insert(resolutionConfig)
      .select()
      .single();

    if (resolutionError) {
      console.error('Error creating resolution config:', resolutionError);
    } else {
      console.log('✅ Resolution config created with HYBRID method!');
    }

    // 3. Create linked market
    const marketData = {
      event_id: event.id,
      question: event.question,
      description: event.description,
      category: event.category,
      status: 'active',
      trading_closes_at: event.trading_closes_at,
      event_date: event.resolution_date,
      creator_id: event.created_by,
      initial_liquidity: event.initial_liquidity,
      outcomes: event.outcomes
    };

    const { data: market, error: marketError } = await supabase
      .from('markets')
      .insert(marketData)
      .select()
      .single();

    if (marketError) {
      console.error('Error creating market:', marketError);
    } else {
      console.log('✅ Linked market created!');
      console.log('Market ID:', market.id);
    }

    console.log('\n🎉 Demo event created successfully!');
    console.log('\nEvent Details:');
    console.log('- Name:', event.name);
    console.log('- Category:', event.category);
    console.log('- Resolution Method: HYBRID (AI + Human)');
    console.log('- AI Weight: 30%, Human Weight: 70%');
    console.log('- Initial Liquidity: ৳' + event.initial_liquidity);
    console.log('- Trading Closes:', event.trading_closes_at);
    console.log('\nView at: https://polymarket-bangladesh.vercel.app/events/' + event.slug);

  } catch (error) {
    console.error('Critical error:', error);
  }
}

createDemoEvent();
