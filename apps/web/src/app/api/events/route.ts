/**
 * Public Events API — serves active markets for the homepage
 * UNIFIED ARCHITECTURE: queries markets table directly (no VIEW)
 *
 * Industry standard: market IS the event — all metadata on markets table.
 * event_definitions is only used for multi-market events (parent container).
 *
 * Includes Bengali text encoding fix.
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
    // pg driver returns numeric as strings — parse to numbers
    current_yes_price: m.current_yes_price != null ? Number(m.current_yes_price) : undefined,
    current_no_price:  m.current_no_price  != null ? Number(m.current_no_price)  : undefined,
    yes_price:         m.yes_price         != null ? Number(m.yes_price)         : undefined,
    no_price:          m.no_price          != null ? Number(m.no_price)          : undefined,
    total_volume:      m.total_volume      != null ? Number(m.total_volume)      : 0,
    liquidity:         m.liquidity         != null ? Number(m.liquidity)         : 0,
    volume_24h:        m.volume_24h        != null ? Number(m.volume_24h)        : 0,
    price_change_24h:  m.price_change_24h  != null ? Number(m.price_change_24h)  : 0,
  }));
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const cursor = searchParams.get('cursor');
    const limit  = parseInt(searchParams.get('limit') || '12');
    const userId = searchParams.get('user_id');

    // ─── Main markets query (unified — no VIEW) ───────────────────────────────
    // event_title = display title (= question for single-market events)
    // event_description = event background context
    // event_category = event category (mirrors market category for single-market)
    const marketsQuery = `
      SELECT
        id,
        COALESCE(event_title, question, name)         AS title,
        question,
        COALESCE(event_description, description)    AS description,
        COALESCE(event_category, category)           AS category,
        subcategory,
        COALESCE(event_tags, to_jsonb(tags), '[]'::jsonb) AS tags,
        image_url,
        slug,
        status,
        is_featured,
        trading_closes_at,
        starts_at,
        ends_at,
        COALESCE(total_volume, 0)                    AS total_volume,
        created_at,
        COALESCE(current_price_yes, yes_price, 0.5)  AS current_yes_price,
        COALESCE(current_price_no, no_price, 0.5)   AS current_no_price,
        COALESCE(liquidity, initial_liquidity, 0)  AS liquidity,
        resolution_method,
        resolved_at,
        winning_outcome,
        event_date,
        event_slug,
        event_answer_type                           AS answer_type,
        creator_id
      FROM markets
      WHERE status = 'active'
        -- event_id IS NULL means standalone markets (not linked to event_definitions) — show them too
    `;

    let finalQuery = marketsQuery;
    const queryParams: any[] = [];

    if (cursor) {
      const cursorResult = await pool.query<{ created_at: string }>(
        'SELECT created_at FROM markets WHERE id = $1',
        [cursor]
      );
      if (cursorResult.rows[0]) {
        finalQuery += ' AND created_at < $1';
        queryParams.push(cursor);
      }
    }

    finalQuery += ` ORDER BY is_featured DESC, created_at DESC LIMIT ${limit}`;

    const marketsResult = await pool.query(finalQuery, queryParams);
    const markets = processMarketData(marketsResult.rows);
    const nextCursor = markets.length > 0 ? markets[markets.length - 1].id : null;

    // ─── Personalized recommendations ──────────────────────────────────────────
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
              `SELECT DISTINCT COALESCE(event_category, category) AS category
               FROM markets WHERE id = ANY($1)`,
              [marketIds]
            );
            const categories = categoriesResult.rows.map(r => r.category).filter(Boolean);
            if (categories.length > 0) {
              const recommendedResult = await pool.query(
                `SELECT id, COALESCE(event_title, question, name) AS title,
                        question, COALESCE(event_description, description) AS description,
                        COALESCE(event_category, category) AS category,
                        subcategory, COALESCE(event_tags, tags) AS tags,
                        image_url, slug, status, is_featured,
                        trading_closes_at, starts_at, ends_at,
                        COALESCE(total_volume, 0) AS total_volume, created_at,
                        COALESCE(current_price_yes, yes_price, 0.5) AS current_yes_price,
                        COALESCE(current_price_no, no_price, 0.5) AS current_no_price,
                        COALESCE(liquidity, initial_liquidity, 0) AS liquidity
                 FROM markets
                 WHERE status = 'active'
                   AND COALESCE(event_category, category) = ANY($1)
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
      events:     markets,    // key: "events" for backwards compat with frontend
      markets:    markets,    // key: "markets" for new code
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
    return NextResponse.json({ events: [], markets: [], nextCursor: null, recommended: [] });
  }
}
