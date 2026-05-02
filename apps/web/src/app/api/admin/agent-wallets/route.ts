/**
 * GET /api/admin/agent-wallets - List agent wallets
 * POST /api/admin/agent-wallets - Create agent wallet
 * DELETE /api/admin/agent-wallets - Delete agent wallet
 * Uses local PostgreSQL (pg)
 */
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/admin/auth-guard';

export async function GET(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  try {
    if (id) {
      const { rows } = await result.pool.query(
        'SELECT * FROM agent_wallets WHERE id = $1', [id]
      );
      return NextResponse.json({ data: rows[0] || null });
    }
    const { rows } = await result.pool.query(
      'SELECT * FROM agent_wallets ORDER BY created_at DESC'
    );
    return NextResponse.json({ data: rows });
  } catch (err) {
    console.error('Agent wallets GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;

  try {
    const body = await req.json();
    const { account_name, address, network, is_active = true } = body;

    const { rows } = await result.pool.query(
      `INSERT INTO agent_wallets (account_name, address, network, is_active)
       VALUES ($1, $2, $3, $4) RETURNING *`,
      [account_name, address, network, is_active]
    );
    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('Agent wallets POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;

  const { searchParams } = new URL(req.url);
  const id = searchParams.get('id');

  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });

  try {
    await result.pool.query('DELETE FROM agent_wallets WHERE id = $1', [id]);
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Agent wallets DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
