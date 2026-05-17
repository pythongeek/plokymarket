/**
 * Public Events API — serves active markets for the homepage
 * FIXED: Uses only columns that exist in markets table
 */
import { NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

export const dynamic = 'force-dynamic';

const fixBengaliEncoding = (text: string | null): string | null => {
  if (!text) return text;
  try {
    if (text.includes('�') || /[\ufffd]/.test(text)) {
      const bytes = new TextEncoder().encode(text);
      const decoded = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
      return decoded;
    }
    return text;
  } catch {
    return text;
  }
};

const processMarketData = (markets: any[]) => {
  return markets.map(m => ({
    ...m,
    title:       fixBengaliEncoding(m.title),
    question:    fixBengaliEncoding(m.question),
    description: fixBengaliEncoding(m.description),
    slug:        fixBengaliEncoding(m.slug),
    current_yes_price: m.current_yes_price != null ? Number(m.current_yes_price) : undefined,
    current_no_price:  m.current_no_price  != null ? Number(m.current_no_price)  : undefined,
    yes_price:         m.yes_price         != null ? Number(m.yes_price)         : undefined,
    no_price:          m.no_price          != null ? Number(m.no_price)          : undefined,
    total_volume:      m.total_volume      != null ? Number(m.total_volume)      : 0,
    liquidity:         m.liquidity         != null ? Number(m.liquidity)         : 0,
    volume_24h:        m.volume_24h        != null ? Number(m.volume_24h)        : 0,
  }));
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit  = parseInt(searchParams.get('limit') || '12');
    const userId = searchParams.get('user_id');

    // ─── FIXED: Use only existing columns ──────────────────────────────────
    const marketsQuery = `
      SELECT
        id,
        COALESCE(name, question, name_bn)         AS title,
        question,
        COALESCE(description, question_bn)        AS description,
        COALESCE(category, market_category)       AS category,
        subcategory,
        COALESCE(tags, '{}')                      AS tags,
        image_url,
        slug,
        status,
        is_featured,
        trading_closes_at,
        starts_at,
        ends_at,
        COALESCE(total_volume, 0)                 AS total_volume,
        created_at,
        COALESCE(current_price_yes, yes_price, 0.5)  AS current_yes_price,
        COALESCE(current_price_no, no_price, 0.5)    AS current_no_price,
        COALESCE(liquidity, initial_liquidity, 0)    AS liquidity,
        resolution_method,
        resolved_at,
        winning_outcome,
        event_date,
        slug                                         AS event_slug,
        answer_type,
        creator_id
      FROM markets
      WHERE status = 'active'
    `;

    let finalQuery = marketsQuery;
    const queryParams: any[] = [];

    if (cursor) {
      finalQuery += ' AND created_at < $1';
      queryParams.push(cursor);
    }

    finalQuery += ` ORDER BY is_featured DESC, created_at DESC LIMIT ${limit}`;

    const marketsResult = await pool.query(finalQuery, queryParams);
    const markets = processMarketData(marketsResult.rows);
    const nextCursor = markets.length > 0 ? markets[markets.length - 1].id : null;

    // ─── Personalized recommendations ──────────────────────────────────────
    let recommendedMarkets: any[] = [];
    if (userId) {
      try {
        const tradesResult = await pool.query<{ market_id: string }>(
          `SELECT DISTINCT market_id FROM trades WHERE user_id = $1 LIMIT 50`,
          [userId]
        );
        if (tradesResult.rows.length > 0) {
          const marketIds = tradesResult.rows.map(r => r.market_id).filter(Boolean);
          if (marketIds.length > 0) {
            const categoriesResult = await pool.query<{ category: string }>(
              `SELECT DISTINCT COALESCE(category, market_category) AS category
               FROM markets WHERE id = ANY($1)`,
              [marketIds]
            );
            const categories = categoriesResult.rows.map(r => r.category).filter(Boolean);
            if (categories.length > 0) {
              const recommendedResult = await pool.query(
                `SELECT id, COALESCE(name, question, name_bn) AS title,
                        question, COALESCE(description, question_bn) AS description,
                        COALESCE(category, market_category) AS category,
                        subcategory, COALESCE(tags, '{}') AS tags,
                        image_url, slug, status, is_featured,
                        trading_closes_at, starts_at, ends_at,
                        COALESCE(total_volume, 0) AS total_volume, created_at,
                        COALESCE(current_price_yes, yes_price, 0.5) AS current_yes_price,
                        COALESCE(current_price_no, no_price, 0.5) AS current_no_price,
                        COALESCE(liquidity, initial_liquidity, 0) AS liquidity
                 FROM markets
                 WHERE status = 'active'
                   AND COALESCE(category, market_category) = ANY($1)
                 ORDER BY total_volume DESC LIMIT 4`,
                [categories]
              );
              recommendedMarkets = processMarketData(recommendedResult.rows);
            }
          }
        }
      } catch (recErr) {
        console.error('[Events API] Recommendations error:', recErr);
      }
    }

    return NextResponse.json({
      events:     markets,
      markets:    markets,
      nextCursor,
      hasMore:    markets.length === limit,
      recommended: recommendedMarkets,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  } catch (err) {
    console.error('[Events API] Fatal:', err);
    return NextResponse.json(
      { error: 'Database query failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
