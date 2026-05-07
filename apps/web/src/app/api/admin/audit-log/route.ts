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
    `SELECT a.*, u.email as admin_email, p.full_name as admin_name
     FROM admin_audit_log a
     LEFT JOIN users u ON a.performed_by = u.id
     LEFT JOIN user_profiles p ON a.performed_by = p.id
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
