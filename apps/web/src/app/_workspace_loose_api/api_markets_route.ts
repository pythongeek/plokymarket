/**
 * GET /api/markets — list all active markets
 * Supports: ?limit=, ?cursor=, ?category=, ?search=
 */
import { NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '20'), 100);
    const cursor = searchParams.get('cursor');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    let sql = `
      SELECT
        id,
        COALESCE(name, question, name_bn) AS title,
        question,
        COALESCE(description, question_bn) AS description,
        COALESCE(category, market_category) AS category,
        subcategory,
        image_url,
        slug,
        status,
        is_featured,
        trading_closes_at,
        COALESCE(total_volume, 0) AS total_volume,
        COALESCE(volume_24h, 0) AS volume_24h,
        COALESCE(current_price_yes, yes_price, 0.5) AS current_yes_price,
        COALESCE(current_price_no, no_price, 0.5) AS current_no_price,
        COALESCE(liquidity, initial_liquidity, 0) AS liquidity,
        resolution_method,
        created_at,
        event_date,
        answer_type,
        unique_traders,
        creator_id
      FROM markets
      WHERE status = 'active'
    `;
    const params: any[] = [];
    let paramIdx = 1;

    if (category) {
      sql += ` AND COALESCE(category, market_category) = $${paramIdx++}`;
      params.push(category);
    }
    if (search) {
      sql += ` AND (name ILIKE $${paramIdx} OR question ILIKE $${paramIdx} OR description ILIKE $${paramIdx} OR slug ILIKE $${paramIdx})`;
      params.push(`%${search}%`);
      paramIdx++;
    }
    if (cursor) {
      sql += ` AND created_at < $${paramIdx++}`;
      params.push(cursor);
    }

    sql += ` ORDER BY is_featured DESC, created_at DESC LIMIT $${paramIdx++}`;
    params.push(limit);

    const result = await pool.query(sql, params);
    const markets = result.rows.map(m => ({
      ...m,
      current_yes_price: m.current_yes_price != null ? Number(m.current_yes_price) : 0.5,
      current_no_price: m.current_no_price != null ? Number(m.current_no_price) : 0.5,
      total_volume: m.total_volume != null ? Number(m.total_volume) : 0,
      volume_24h: m.volume_24h != null ? Number(m.volume_24h) : 0,
      liquidity: m.liquidity != null ? Number(m.liquidity) : 0,
    }));

    const nextCursor = markets.length > 0 ? markets[markets.length - 1].id : null;

    return NextResponse.json({
      success: true,
      markets,
      nextCursor,
      hasMore: markets.length === limit,
      total: markets.length,
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store, must-revalidate',
      }
    });
  } catch (err) {
    console.error('[Markets API] Fatal:', err);
    return NextResponse.json(
      { error: 'Database query failed', details: (err as Error).message },
      { status: 500 }
    );
  }
}
