import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import fallbackData from '@/data/fallback-sellers.json';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const method = (searchParams.get('method') || 'bkash').toLowerCase();
    const amount = parseFloat(searchParams.get('amount') || '1000');

    if (method !== 'bkash' && method !== 'nagad') {
        return NextResponse.json({ error: 'Invalid method' }, { status: 400 });
    }

    const supabase = createClient();

    try {
        // 1. Check cache first (less than 5 minutes old)
        const { data: cached } = await supabase
            .from('p2p_seller_cache')
            .select('sellers_data, scraped_at, affiliate_link')
            .eq('method', method)
            .gt('expires_at', new Date().toISOString())
            .order('scraped_at', { ascending: false })
            .maybeSingle();

        if (cached) {
            return NextResponse.json({
                status: 'cached',
                sellers: cached.sellers_data,
                affiliate_link: cached.affiliate_link,
                scraped_at: cached.scraped_at,
                is_fresh: true
            }, {
                headers: {
                    'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
                }
            });
        }

        // 2. Trigger n8n scraping (async)
        const n8nUrl = process.env.N8N_P2P_WEBHOOK_URL || 'http://localhost:5680/webhook/scrape-binance-p2p';
        fetch(n8nUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ method, amount })
        }).catch(err => console.error('N8N trigger failed:', err));

        // 3. Return stale data if available (graceful degradation)
        const { data: stale } = await supabase
            .from('p2p_seller_cache')
            .select('sellers_data, scraped_at, affiliate_link')
            .eq('method', method)
            .order('scraped_at', { ascending: false })
            .limit(1)
            .maybeSingle();

        if (stale) {
            return NextResponse.json({
                status: 'scraping',
                sellers: stale.sellers_data,
                affiliate_link: stale.affiliate_link,
                message: 'আমরা সর্বশেষ তথ্য সংগ্রহ করছি...',
                is_fresh: false,
                scraped_at: stale.scraped_at
            });
        }

        // 4. Return fallback data as last resort
        const fallback = (fallbackData as any)[method] || [];
        return NextResponse.json({
            status: 'initiating',
            message: 'ডেটা সংগ্রহ শুরু হয়েছে, অনুগ্রহ করে অপেক্ষা করুন...',
            sellers: fallback,
            is_fallback: true
        });

    } catch (error) {
        console.error('P2P API Error:', error);
        return NextResponse.json(
            { error: 'ডেটা লোড করতে সমস্যা হয়েছে', status: 'error' },
            { status: 500 }
        );
    }
}
