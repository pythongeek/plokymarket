// @ts-nocheck
import { NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';
import { Pool } from 'pg';

const pgPool = new Pool({
  host: process.env.LOCAL_DB_HOST || '127.0.0.1',
  port: parseInt(process.env.LOCAL_DB_PORT || '5433'),
  user: process.env.LOCAL_DB_USER || 'postgres',
  password: process.env.LOCAL_DB_PASSWORD || 'postgres',
  database: process.env.LOCAL_DB_NAME || 'polymarket',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

const JWT_SECRET = process.env.SUPABASE_JWT_SECRET || process.env.LOCAL_JWT_SECRET || process.env.JWT_SECRET || '';

export async function POST(req: Request) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing authorization' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const isSuperAdmin = decoded.is_super_admin || decoded.role === 'service_role';
    if (!isSuperAdmin) {
      return NextResponse.json({ error: 'Super Admin required' }, { status: 403 });
    }

    const adminId = decoded.sub;
    const body = await req.json();
    const { market_id, winning_outcome } = body;

    if (!market_id || !winning_outcome) {
      return NextResponse.json({ error: 'Missing market_id or winning_outcome' }, { status: 400 });
    }

    if (!['YES', 'NO'].includes(winning_outcome)) {
      return NextResponse.json({ error: 'winning_outcome must be YES or NO' }, { status: 400 });
    }

    const client = await pgPool.connect();
    try {
      await client.query('BEGIN');
      const { rows: marketRows } = await client.query('SELECT status, name FROM markets WHERE id = $1 FOR UPDATE', [market_id]);
      if (marketRows.length === 0) throw new Error('Market not found');
      if (marketRows[0].status === 'resolved') throw new Error('Market already resolved');

      await client.query('SELECT settle_market_with_collateral($1, $2::outcome_type)', [market_id, winning_outcome]);

      await client.query(
        "INSERT INTO admin_audit_log (admin_id, action, resource, target_id, new_value, details, created_at) VALUES ($1, $2, $3, $4, $5::jsonb, $6::jsonb, NOW())",
        [adminId, 'settle_market', 'market', market_id,
         JSON.stringify({ winning_outcome, previous_status: marketRows[0].status }),
         JSON.stringify({ message: 'Settled to ' + winning_outcome })]
      );

      await client.query('COMMIT');
      return NextResponse.json({ success: true, message: 'Market settled to ' + winning_outcome, market_name: marketRows[0].name });
    } catch (dbErr: any) {
      await client.query('ROLLBACK');
      throw dbErr;
    } finally {
      client.release();
    }
  } catch (error: any) {
    console.error('[Settlement API] Error:', error);
    const msg = error.message || 'Internal error';
    const status = msg.includes('not found') || msg.includes('already resolved') ? 400 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
}
