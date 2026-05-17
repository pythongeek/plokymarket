import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get('page') || '1'));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get('limit') || '25')));
  const action = searchParams.get('action') || '';
  const fromDate = searchParams.get('from') || '';
  const toDate = searchParams.get('to') || '';
  const offset = (page - 1) * limit;

  const conditions: string[] = [];
  const values: any[] = [];
  let paramIdx = 1;

  if (action) {
    conditions.push(`a.action ILIKE $${paramIdx++}`);
    values.push(`%${action}%`);
  }
  if (fromDate) {
    conditions.push(`a.created_at >= $${paramIdx++}`);
    values.push(fromDate);
  }
  if (toDate) {
    conditions.push(`a.created_at <= $${paramIdx++}`);
    values.push(toDate + 'T23:59:59');
  }

  const where = conditions.length ? 'WHERE ' + conditions.join(' AND ') : '';

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM admin_audit_log a ${where}`,
    values
  );
  const total = parseInt(countResult.rows[0].count);

  const dataResult = await pool.query(
    `SELECT 
      a.id,
      a.admin_id,
      a.action,
      a.entity_type AS target_type,
      a.entity_id AS target_id,
      a.old_value,
      a.new_value,
      a.reason,
      a.ip_address,
      a.created_at,
      u.email AS admin_email,
      p.full_name AS admin_name,
      COALESCE(
        jsonb_build_object('old', a.old_value, 'new', a.new_value),
        '{}'
      ) AS details
     FROM admin_audit_log a
     LEFT JOIN users u ON a.admin_id = u.id
     LEFT JOIN user_profiles p ON a.admin_id = p.id
     ${where}
     ORDER BY a.created_at DESC
     LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
    [...values, limit, offset]
  );

  return NextResponse.json({
    data: dataResult.rows,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
