/**
 * GET/POST /api/admin/markets
 * Admin market management — unified architecture (market IS event).
 *
 * GET params: status, category, search, limit, offset
 * POST body: market fields to insert
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const status   = searchParams.get('status')   || undefined;
  const category = searchParams.get('category') || undefined;
  const search   = searchParams.get('search')   || undefined;
  const limit    = Math.min(parseInt(searchParams.get('limit') || '50'), 200);
  const offset   = parseInt(searchParams.get('offset') || '0');

  const conditions: string[] = [];
  const params: any[] = [];
  let i = 1;

  if (status) {
    conditions.push(`status = $${i++}`);
    params.push(status);
  }
  if (category) {
    conditions.push(`COALESCE(event_category, category) = $${i++}`);
    params.push(category);
  }
  if (search) {
    conditions.push(`(
      COALESCE(event_title, question, name) ILIKE $${i} OR
      question ILIKE $${i} OR slug ILIKE $${i}
    )`);
    params.push(`%${search}%`);
    i++;
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const sql = `
    SELECT
      m.id, m.slug, m.status,
      COALESCE(m.event_title, m.question, m.name)       AS title,
      m.question,
      COALESCE(m.event_description, m.description)   AS description,
      COALESCE(m.event_category, m.category)           AS category,
      m.subcategory,
      COALESCE(m.event_tags, '[]'::jsonb) AS tags,
      m.image_url,
      m.is_featured,
      m.trading_closes_at,
      m.event_date,
      COALESCE(m.current_price_yes, m.yes_price, 0.5) AS current_yes_price,
      COALESCE(m.current_price_no, m.no_price, 0.5)   AS current_no_price,
      COALESCE(m.total_volume, 0)                     AS total_volume,
      COALESCE(m.volume_24h, 0)                       AS volume_24h,
      COALESCE(m.liquidity, m.initial_liquidity, 0)   AS liquidity,
      COALESCE(m.unique_traders, 0)                   AS unique_traders,
      m.resolution_method,
      m.resolved_at,
      m.winning_outcome,
      m.event_id,
      m.creator_id,
      m.created_at,
      m.updated_at,
      m.event_answer_type                           AS answer_type,
      m.event_source_url                            AS source_url,
      m.event_slug
    FROM markets m
    ${where}
    ORDER BY m.created_at DESC
    LIMIT $${i++} OFFSET $${i}
  `;
  params.push(limit, offset);

  const [dataResult, countResult] = await Promise.all([
    pool.query(sql, params),
    pool.query(`SELECT COUNT(*) FROM markets ${where}`, params.slice(0, -2)),
  ]);

  return NextResponse.json({
    data: dataResult.rows,
    count: parseInt(countResult.rows[0]?.count || '0'),
    limit,
    offset,
  });
}

// ─── POST ─────────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;
  const userId = authResult.user.id;

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  const {
    title, question, description, category, tags,
    image_url, source_url, trading_closes_at, event_date,
    is_featured, initial_liquidity, answer_type, resolution_method,
    slug,
  } = body;

  if (!title?.trim()) return NextResponse.json({ error: 'title is required' }, { status: 400 });
  if (!question?.trim()) return NextResponse.json({ error: 'question is required' }, { status: 400 });
  if (!category?.trim()) return NextResponse.json({ error: 'category is required' }, { status: 400 });

  const rpcPayload = {
    title: title.trim(),
    question: question.trim(),
    description: description?.trim() || '',
    category: (category || 'general').toLowerCase(),
    tags: Array.isArray(tags) ? tags : [],
    image_url: image_url || '',
    source_url: source_url || '',
    trading_closes_at: trading_closes_at ? new Date(trading_closes_at).toISOString() : null,
    event_date: event_date ? new Date(event_date).toISOString() : null,
    is_featured: !!is_featured,
    initial_liquidity: parseFloat(initial_liquidity) || 1000,
    answer_type: answer_type || 'binary',
    resolution_method: resolution_method || 'manual_admin',
    slug: slug || '',
  };

  const rpcResult = await pool.query(
    'SELECT create_event_complete($1, $2) AS result',
    [JSON.stringify(rpcPayload), userId]
  );

  const out = rpcResult.rows[0]?.result;
  if (!out?.success) {
    return NextResponse.json({ error: out?.message || 'Creation failed' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    market_id: out.market_id,
    slug: out.slug,
    message: out.message,
  }, { status: 201 });
}
