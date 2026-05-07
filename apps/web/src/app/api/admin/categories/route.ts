import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    const result = await pool.query(
      `SELECT c.*, (SELECT COUNT(*) FROM markets WHERE market_category = c.slug OR category = c.slug) as market_count
       FROM custom_categories c ORDER BY sort_order ASC, name ASC`
    );
    return NextResponse.json(result.rows || []);
  } catch (error) {
    console.error('[Categories GET]', error);
    return NextResponse.json({ error: 'Failed to fetch categories' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { name, slug, description, icon, color, sort_order } = body;
    if (!name || !slug) return NextResponse.json({ error: 'name and slug required' }, { status: 400 });

    const result = await pool.query(
      `INSERT INTO custom_categories (name, slug, description, icon, color, sort_order, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, true) RETURNING *`,
      [name, slug, description || '', icon || '', color || '#3b82f6', sort_order || 0]
    );
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Categories POST]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const body = await req.json();
    const { id, is_active, name, slug } = body;
    if (!id) return NextResponse.json({ error: 'id required' }, { status: 400 });

    const updates: string[] = [];
    const values: any[] = [];
    let i = 1;

    if (is_active !== undefined) { updates.push(`is_active = $${i++}`); values.push(is_active); }
    if (name !== undefined) { updates.push(`name = $${i++}`); values.push(name); }
    if (slug !== undefined) { updates.push(`slug = $${i++}`); values.push(slug); }

    if (updates.length === 0) return NextResponse.json({ error: 'No fields to update' }, { status: 400 });

    values.push(id);
    await pool.query(`UPDATE custom_categories SET ${updates.join(', ')} WHERE id = $${i}`, values);
    const result = await pool.query('SELECT * FROM custom_categories WHERE id = $1', [id]);
    return NextResponse.json(result.rows[0]);
  } catch (error: any) {
    console.error('[Categories PUT]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
