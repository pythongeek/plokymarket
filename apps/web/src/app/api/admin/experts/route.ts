/**
 * GET /api/admin/experts - List expert panel members and votes
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
  const tab = searchParams.get('tab') || 'experts';

  try {
    if (tab === 'votes') {
      const expertId = searchParams.get('expert_id');
      let query = `
        SELECT
          ev.*,
          ep.expert_name,
          ep.specializations,
          ep.reputation_score,
          m.question as event_question,
          m.id as market_id
        FROM expert_votes ev
        JOIN expert_panel ep ON ep.id = ev.expert_id
        LEFT JOIN markets m ON m.id = ev.event_id
      `;
      const params: unknown[] = [];
      if (expertId) {
        params.push(expertId);
        query += ` WHERE ev.expert_id = $${params.length}`;
      }
      query += ` ORDER BY ev.created_at DESC LIMIT 100`;
      const result = await admin.pool.query(query, params);
      return NextResponse.json({ data: result.rows });
    } else if (tab === 'reviews') {
      // Fetch expert panel reviews
      const result = await admin.pool.query(`
        SELECT 
          epr.*,
          dr.dispute_reason as dispute_reason
        FROM expert_panel_reviews epr
        LEFT JOIN dispute_records dr ON dr.id = epr.dispute_id
        ORDER BY epr.assigned_at DESC
        LIMIT 100
      `);
      return NextResponse.json({ data: result.rows });
    } else {
      // Fetch expert panel members
      const result = await admin.pool.query(`
        SELECT 
          ep.*,
          up.full_name,
          up.email
        FROM expert_panel ep
        LEFT JOIN users u ON u.id = ep.user_id
        LEFT JOIN user_profiles up ON up.id = u.id
        ORDER BY ep.reputation_score DESC
      `);
      return NextResponse.json({ data: result.rows });
    }
  } catch (err) {
    console.error('Error fetching experts:', err);
    return NextResponse.json({ error: 'Failed to fetch experts' }, { status: 500 });
  }
}

/**
 * POST /api/admin/experts - Add new expert panel member
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await req.json();
    const { user_id, expert_name, credentials, specializations, bio, email } = body;

    const result = await admin.pool.query(
      `INSERT INTO expert_panel (user_id, expert_name, credentials, specializations, bio, email)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [user_id, expert_name, credentials, specializations || [], bio, email]
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating expert:', err);
    return NextResponse.json({ error: 'Failed to create expert' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/experts - Update expert record
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await req.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (action === 'verify') {
      const result = await admin.pool.query(
        `UPDATE expert_panel 
         SET is_verified = true, verified_by = $2, verified_at = now(), updated_at = now()
         WHERE id = $1 RETURNING *`,
        [id, admin.userId]
      );
      return NextResponse.json({ data: result.rows[0] });
    }

    if (action === 'toggle_active') {
      const result = await admin.pool.query(
        `UPDATE expert_panel SET is_active = NOT is_active, updated_at = now() WHERE id = $1 RETURNING *`,
        [id]
      );
      return NextResponse.json({ data: result.rows[0] });
    }

    // Generic update
    const fields = Object.keys(updates).filter(k => updates[k] !== undefined);
    if (fields.length === 0) {
      return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
    }
    const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
    const values = fields.map(f => updates[f]);

    const result = await admin.pool.query(
      `UPDATE expert_panel SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error updating expert:', err);
    return NextResponse.json({ error: 'Failed to update expert' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/experts - Remove expert panel member
 */
export async function DELETE(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const result = await admin.pool.query(
      'DELETE FROM expert_panel WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Expert not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting expert:', err);
    return NextResponse.json({ error: 'Failed to delete expert' }, { status: 500 });
  }
}
