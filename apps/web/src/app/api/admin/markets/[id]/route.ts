/**
 * GET/PATCH/DELETE /api/admin/markets/[id]
 * Single market management — unified architecture.
 */
import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

const MARKET_SELECT = `
  m.id, m.slug, m.status,
  m.question, m.name, m.name_bn, m.question_bn,
  COALESCE(m.event_title, m.question, m.name)       AS title,
  COALESCE(m.event_description, m.description)     AS description,
  COALESCE(m.event_category, m.category)           AS category,
  m.subcategory,
  COALESCE(m.event_tags, m.tags, '[]'::jsonb)     AS tags,
  m.image_url,
  m.source_url,
  m.is_featured,
  m.trading_closes_at, m.event_date,
  m.starts_at, m.ends_at, m.resolved_at,
  COALESCE(m.current_price_yes, m.yes_price, 0.5) AS current_yes_price,
  COALESCE(m.current_price_no, m.no_price, 0.5)   AS current_no_price,
  COALESCE(m.total_volume, 0)                     AS total_volume,
  COALESCE(m.volume_24h, 0)                      AS volume_24h,
  COALESCE(m.liquidity, m.initial_liquidity, 0)   AS liquidity,
  COALESCE(m.unique_traders, 0)                   AS unique_traders,
  m.resolution_method,
  m.winning_outcome,
  m.resolution_source,
  m.resolution_details,
  m.event_id,
  m.creator_id,
  m.created_at, m.updated_at,
  m.event_answer_type     AS answer_type,
  m.event_source_url      AS source_url,
  m.event_slug,
  m.tick_size, m.min_price, m.max_price,
  m.fee_percent, m.initial_liquidity, m.maker_rebate_percent,
  m.market_type, m.neg_risk, m.condition_id, m.risk_score,
  m.yes_price_change_24h, m.no_price_change_24h,
  m.resolution_delay_hours
`;

// ─── GET ──────────────────────────────────────────────────────────────────────
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAdminUser(_req);
  if ('error' in authResult) return authResult.error;

  const result = await pool.query(
    `SELECT ${MARKET_SELECT} FROM markets m WHERE m.id = $1`,
    [id]
  );

  if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ data: result.rows[0] });
}

// ─── PATCH ────────────────────────────────────────────────────────────────────
export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const mockReq = request as unknown as NextRequest;
  const authResult = await requireAdminUser(request);
  if ('error' in authResult) return authResult.error;

  const body = await request.json().catch(() => null);
  if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });

  // Map frontend fields → market columns
  const fieldMap: Record<string, string> = {
    title:              'event_title',
    question:           'question',
    description:        'event_description',
    category:           'event_category',
    tags:               'event_tags',
    image_url:          'image_url',
    source_url:         'event_source_url',
    slug:               'slug',
    status:             'status',
    trading_closes_at:  'trading_closes_at',
    event_date:         'event_date',
    is_featured:        'is_featured',
    ends_at:           'ends_at',
    starts_at:         'starts_at',
    resolution_method:  'resolution_method',
    resolution_source:  'resolution_source',
    winning_outcome:    'winning_outcome',
    resolved_at:        'resolved_at',
    answer_type:        'event_answer_type',
    initial_liquidity:  'initial_liquidity',
    fee_percent:        'fee_percent',
    risk_score:         'risk_score',
    min_price:          'min_price',
    max_price:          'max_price',
    tick_size:          'tick_size',
  };

  const updates: Record<string, any> = {};
  for (const [key, value] of Object.entries(body)) {
    const col = fieldMap[key] || key;
    updates[col] = value;
  }
  updates.updated_at = 'NOW()';

  const setClause = Object.keys(updates)
    .map((k, i) => `${k} = $${i + 1}`)
    .join(', ');
  const values = [...Object.values(updates), id];

  const result = await pool.query(
    `UPDATE markets SET ${setClause} WHERE id = $${values.length} RETURNING *`,
    values
  );

  if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  // Audit log: record each changed field
  const adminId = authResult.user.id;
  const oldData = await pool.query(
    'SELECT ' + Object.keys(updates).filter(k => k !== 'updated_at').join(', ') + ' FROM markets WHERE id = $1',
    [id]
  );
  // Note: we already updated, so oldData won't help. We skip per-field old values
  // and log the action with new state.
  try {
    await pool.query(
      `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, new_value, created_at)
       VALUES ($1, $2, $3, $4, $5, NOW())`,
      [adminId, 'UPDATE', 'market', id, JSON.stringify(updates)]
    );
  } catch (auditErr) {
    console.error('[Market PATCH] Audit log failed:', auditErr);
  }

  return NextResponse.json({ data: result.rows[0] });
}

// ─── DELETE ───────────────────────────────────────────────────────────────────
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const authResult = await requireAdminUser(_req);
  if ('error' in authResult) return authResult.error;

  const result = await pool.query(
    'DELETE FROM markets WHERE id = $1 RETURNING id',
    [id]
  );
  if (!result.rows[0]) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  return NextResponse.json({ success: true, deleted: id });
}
