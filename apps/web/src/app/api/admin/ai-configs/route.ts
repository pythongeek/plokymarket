/**
 * GET /api/admin/ai-configs - Get AI agent configs and usage logs
 * PATCH /api/admin/ai-configs - Update AI agent config
 * Uses local PostgreSQL (pg)
 */
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/admin/auth-guard';

export async function GET(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get('type') || 'configs';

  try {
    if (type === 'logs') {
      const { rows } = await result.pool.query(`
        SELECT * FROM ai_usage_logs
        ORDER BY created_at DESC LIMIT 100
      `);
      return NextResponse.json({ data: rows });
    } else {
      const { rows } = await result.pool.query(`
        SELECT * FROM ai_agent_configs
        ORDER BY pipeline ASC
      `);
      return NextResponse.json({ data: rows });
    }
  } catch (err) {
    console.error('AI configs error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  const result = await admin();
  if (result.error) return result.error;

  try {
    const body = await req.json();
    const { id, updates } = body;

    if (!id || !updates) {
      return NextResponse.json({ error: 'Missing id or updates' }, { status: 400 });
    }

    const setClauses: string[] = [];
    const values: any[] = [];
    let paramIdx = 1;

    if (updates.status !== undefined) {
      setClauses.push(`status = $${paramIdx++}`);
      values.push(updates.status);
    }
    if (updates.daily_token_limit !== undefined) {
      setClauses.push(`daily_token_limit = $${paramIdx++}`);
      values.push(updates.daily_token_limit);
    }
    if (updates.updated_at !== undefined) {
      setClauses.push(`updated_at = $${paramIdx++}`);
      values.push(updates.updated_at);
    }

    if (setClauses.length === 0) {
      return NextResponse.json({ error: 'No updates provided' }, { status: 400 });
    }

    values.push(id);
    const { rows } = await result.pool.query(
      `UPDATE ai_agent_configs SET ${setClauses.join(', ')}, updated_at = NOW()
       WHERE id = $${paramIdx} RETURNING *`,
      values
    );

    return NextResponse.json({ data: rows[0] });
  } catch (err) {
    console.error('AI configs PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
