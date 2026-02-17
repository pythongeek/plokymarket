import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const method = searchParams.get('method');
    const amount = searchParams.get('amount') || '1000';

    if (!method || (method !== 'bkash' && method !== 'nagad')) {
        return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
    }

    const supabase = createClient();

    // 1. Check cache first
    const { data: cached, error: cacheError } = await supabase
        .from('p2p_seller_cache')
        .select('*')
        .eq('method', method)
        .gt('expires_at', new Date().toISOString())
        .maybeSingle();

    if (cached) {
        return NextResponse.json({
            sellers: cached.sellers_data,
            cached: true,
            affiliate_link: cached.affiliate_link,
            timestamp: cached.scraped_at
        });
    }

    // 2. Trigger n8n scraping (async)
    // We don't wait for the scraper to finish to avoid timeout
    const n8nUrl = process.env.N8N_P2P_WEBHOOK_URL || 'http://localhost:5680/webhook-test/scrape-binance-p2p';

    fetch(n8nUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ method, amount }),
    }).catch(err => console.error('n8n trigger failed:', err));

    return NextResponse.json({
        status: 'scraping',
        message: 'আমরা বাইন্যান্স থেকে সেরা অফারগুলো সংগ্রহ করছি...',
        estimated_time: '১০-১৫ সেকেন্ড'
    });
}
