import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
  const status = searchParams.get('status') || 'all'; // all, flagged, clean
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let i = 1;

  if (status === 'flagged') {
    conditions.push(`is_flagged = true`);
  } else if (status === 'clean') {
    conditions.push(`(is_flagged = false OR is_flagged IS NULL)`);
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countRes = await pool.query(`SELECT COUNT(*) FROM market_comments ${where}`, values);
  const total = parseInt(countRes.rows[0].count);

  const dataRes = await pool.query(
    `SELECT c.*, u.email as user_email, m.question as market_question
     FROM market_comments c
     LEFT JOIN users u ON c.user_id = u.id
     LEFT JOIN markets m ON c.market_id = m.id
     ${where}
     ORDER BY c.created_at DESC
     LIMIT $${i} OFFSET $${i + 1}`,
    [...values, limit, offset]
  );

  return NextResponse.json({ data: dataRes.rows, total, page, pages: Math.ceil(total / limit) });
}

export async function PATCH(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const body = await req.json().catch(() => ({}));
  const { id, action, reason } = body;
  if (!id || !action) return NextResponse.json({ error: 'id and action required' }, { status: 400 });

  if (action === 'flag') {
    await pool.query(
      `UPDATE market_comments SET is_flagged = true, flagged_reason = $1, moderated_by = $2, moderated_at = NOW() WHERE id = $3`,
      [reason || '', authResult.user.id, id]
    );
  } else if (action === 'unflag') {
    await pool.query(
      `UPDATE market_comments SET is_flagged = false, flagged_reason = NULL, moderated_by = $1, moderated_at = NOW() WHERE id = $2`,
      [authResult.user.id, id]
    );
  } else if (action === 'delete') {
    await pool.query(`DELETE FROM market_comments WHERE id = $1`, [id]);
  }

  return NextResponse.json({ success: true });
}
