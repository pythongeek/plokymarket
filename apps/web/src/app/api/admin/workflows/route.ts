/**
 * GET /api/admin/workflows - List workflow configurations
 * Uses local PostgreSQL (pg) for all data operations
 */
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/admin/auth-guard';

export async function GET(req: NextRequest) {
  const authResult = await admin();
  if (authResult.error) return authResult.error;

  try {
    const result = await authResult.pool.query(`
      SELECT 
        wc.*,
        uwr.id as last_run_id,
        uwr.status as last_run_status,
        uwr.created_at as last_run_at,
        uwr.ended_at as last_ended_at,
        uwr.result as last_run_result
      FROM workflow_configs wc
      LEFT JOIN upstash_workflow_runs uwr 
        ON uwr.workflow_name = wc.name 
        AND uwr.created_at = (
          SELECT MAX(created_at) FROM upstash_workflow_runs 
          WHERE workflow_name = wc.name
        )
      ORDER BY wc.name ASC
    `);
    return NextResponse.json({ data: result.rows });
  } catch (err) {
    console.error('Error fetching workflows:', err);
    return NextResponse.json({ error: 'Failed to fetch workflows' }, { status: 500 });
  }
}

/**
 * POST /api/admin/workflows - Create new workflow config
 */
export async function POST(req: NextRequest) {
  const authResult = await admin();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { name, endpoint, cron_expression, is_active } = body;

    if (!name || !endpoint) {
      return NextResponse.json({ error: 'name and endpoint are required' }, { status: 400 });
    }

    const result = await authResult.pool.query(
      `INSERT INTO workflow_configs (name, endpoint, cron_expression, is_active)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [name, endpoint, cron_expression, is_active ?? false]
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating workflow:', err);
    return NextResponse.json({ error: 'Failed to create workflow' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/workflows - Update workflow config (toggle active, update fields)
 */
export async function PATCH(req: NextRequest) {
  const authResult = await admin();
  if (authResult.error) return authResult.error;

  try {
    const body = await req.json();
    const { id, action, ...updates } = body;

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    if (action === 'toggle') {
      const result = await authResult.pool.query(
        `UPDATE workflow_configs 
         SET is_active = NOT is_active, updated_at = now() 
         WHERE id = $1 RETURNING *`,
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

    const result = await authResult.pool.query(
      `UPDATE workflow_configs SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
      [id, ...values]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error updating workflow:', err);
    return NextResponse.json({ error: 'Failed to update workflow' }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/workflows - Remove workflow config
 */
export async function DELETE(req: NextRequest) {
  const authResult = await admin();
  if (authResult.error) return authResult.error;

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const result = await authResult.pool.query(
      'DELETE FROM workflow_configs WHERE id = $1 RETURNING id',
      [id]
    );

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('Error deleting workflow:', err);
    return NextResponse.json({ error: 'Failed to delete workflow' }, { status: 500 });
  }
}
