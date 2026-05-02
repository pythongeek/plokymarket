/**
 * GET /api/admin/resolvers - List resolvers
 * Uses local PostgreSQL (pg) for all data operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin/auth-guard';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  const { searchParams } = new URL(req.url);
  const is_active = searchParams.get('is_active');

  try {
    let query = 'SELECT * FROM resolvers WHERE 1=1';
    const params: unknown[] = [];

    if (is_active !== null && is_active !== undefined) {
      params.push(is_active === 'true');
      query += ` AND is_active = $${params.length}`;
    }

    query += ' ORDER BY name ASC';

    const result = await admin.pool.query(query, params);
    return NextResponse.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching resolvers:', err);
    return NextResponse.json({ error: 'Failed to fetch resolvers' }, { status: 500 });
  }
}

/**
 * POST /api/admin/resolvers - Add new resolver
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await req.json();
    const { address, name, type, description, website_url } = body;

    if (!address || !name || !type) {
      return NextResponse.json({ error: 'address, name, and type are required' }, { status: 400 });
    }

    const result = await admin.pool.query(
      `INSERT INTO resolvers (address, name, type, description, website_url)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [address, name, type, description, website_url]
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === '23505') {
      return NextResponse.json({ error: 'Resolver with this address already exists' }, { status: 409 });
    }
    console.error('Error creating resolver:', err);
    return NextResponse.json({ error: 'Failed to create resolver' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/resolvers - Update resolver
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await req.json();
    const { address, ...updates } = body;

    if (!address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }

    const fields = Object.keys(updates).filter(k => updates[k] !== undefined);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => updates[f]);

    const result = await admin.pool.query(
      `UPDATE resolvers SET ${setClause} WHERE address = $1 RETURNING *`,
      [address, ...values]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Resolver not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error updating resolver:', err);
    return NextResponse.json({ error: 'Failed to update resolver' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/resolvers - Remove resolver
 */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'address is required' }, { status: 400 });
    }

    const result = await admin.pool.query(
      'DELETE FROM resolvers WHERE address = $1 RETURNING address',
      [address]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Resolver not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting resolver:', err);
    return NextResponse.json({ error: 'Failed to delete resolver' }, { status: 500 });
  }
}
