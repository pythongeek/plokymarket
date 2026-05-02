/**
 * GET /api/admin/disputes - List dispute records and manual review queue
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
  const tab = searchParams.get('tab') || 'disputes';
  const status = searchParams.get('status');

  try {
    if (tab === 'reviews') {
      // Fetch manual review queue
      let query = `
        SELECT 
          mrq.*,
          m.question as market_question,
          m.category as market_category,
          m.status as market_status,
          ats.trust_score,
          ats.ai_confidence,
          ats.ai_reasoning,
          ats.ai_sources
        FROM manual_review_queue mrq
        LEFT JOIN markets m ON m.id = mrq.market_id
        LEFT JOIN ai_trust_scores ats ON ats.id = mrq.ai_trust_score_id
        WHERE 1=1
      `;
      const params: unknown[] = [];

      if (status && status !== 'all') {
        params.push(status);
        query += ` AND mrq.status = $${params.length}`;
      } else {
        query += ` AND mrq.status IN ('pending', 'in_review')`;
      }

      query += ` ORDER BY mrq.priority DESC, mrq.created_at ASC`;

      const result = await admin.pool.query(query, params);
      return NextResponse.json({ data: result.rows });
    } else {
      // Fetch dispute records
      let query = `
        SELECT 
          dr.*,
          m.question as market_question,
          m.status as market_status,
          up.full_name as disputed_by_name
        FROM dispute_records dr
        LEFT JOIN markets m ON m.id = dr.event_id
        LEFT JOIN user_profiles up ON up.id = dr.disputed_by
        WHERE 1=1
      `;
      const params: unknown[] = [];

      if (status && status !== 'all') {
        params.push(status);
        query += ` AND dr.status = $${params.length}`;
      }

      query += ` ORDER BY dr.created_at DESC`;

      const result = await admin.pool.query(query, params);
      return NextResponse.json({ data: result.rows });
    }
  } catch (err) {
    console.error('Error fetching disputes:', err);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}

/**
 * POST /api/admin/disputes - Create a new dispute record
 */
export async function POST(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await req.json();
    const {
      event_id, disputed_by, dispute_type, dispute_reason,
      evidence_urls, bond_amount, status
    } = body;

    const result = await admin.pool.query(
      `INSERT INTO dispute_records 
        (event_id, disputed_by, dispute_type, dispute_reason, evidence_urls, bond_amount, status)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [event_id, disputed_by, dispute_type, dispute_reason, evidence_urls || [], bond_amount || 0, status || 'pending']
    );

    return NextResponse.json({ data: result.rows[0] }, { status: 201 });
  } catch (err) {
    console.error('Error creating dispute:', err);
    return NextResponse.json({ error: 'Failed to create dispute' }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/disputes - Update dispute, manual review, resolve dispute, or manual resolve
 */
export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin();
  if (admin.error) {
    return NextResponse.json({ error: admin.error }, { status: admin.status });
  }

  try {
    const body = await req.json();
    const { id, type, action, ...updates } = body;

    // Handle resolve_dispute action
    if (action === 'resolve_dispute') {
      const { dispute_id, reviewed_by, resolution, review_notes, return_bond } = body;
      const ruling = resolution === 'upheld' ? 'upheld' : 'dismissed';
      const ruling_at = new Date().toISOString();

      const result = await admin.pool.query(
        `UPDATE dispute_records 
         SET ruling = $2, ruling_reason = $3, ruling_at = $4, 
             status = CASE WHEN $2 = 'upheld' THEN 'accepted' ELSE 'rejected' END,
             bond_status = CASE WHEN $5 = true AND $2 = 'upheld' THEN 'returned' 
                                WHEN $5 = false THEN 'forfeited' ELSE bond_status END,
             updated_at = now(), resolved_at = now()
         WHERE id = $1 RETURNING *`,
        [dispute_id, ruling, review_notes, ruling_at, return_bond]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Dispute not found' }, { status: 404 });
      }
      return NextResponse.json({ data: result.rows[0] });
    }

    // Handle manual_resolve action
    if (action === 'manual_resolve') {
      const { market_id, admin_id, outcome, reasoning } = body;
      const winning_outcome = outcome === 1 ? 'YES' : 'NO';

      // Update market resolution
      const marketResult = await admin.pool.query(
        `UPDATE markets 
         SET resolution = $2, winning_outcome = $3, resolved_at = now(), updated_at = now()
         WHERE id = $1 RETURNING *`,
        [market_id, 'manual_admin', winning_outcome]
      );

      // Update manual review status
      if (id) {
        await admin.pool.query(
          `UPDATE manual_review_queue SET status = 'approved', updated_at = now() WHERE id = $1`,
          [id]
        );
      }

      if (marketResult.rowCount === 0) {
        return NextResponse.json({ error: 'Market not found' }, { status: 404 });
      }
      return NextResponse.json({ data: marketResult.rows[0] });
    }

    if (!id || !type) {
      return NextResponse.json({ error: 'id and type are required' }, { status: 400 });
    }

    let result;
    if (type === 'dispute') {
      const fields = Object.keys(updates).filter(k => updates[k] !== undefined);
      if (fields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }
      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const values = fields.map(f => updates[f]);
      
      result = await admin.pool.query(
        `UPDATE dispute_records SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
    } else if (type === 'review') {
      const fields = Object.keys(updates).filter(k => updates[k] !== undefined);
      if (fields.length === 0) {
        return NextResponse.json({ error: 'No fields to update' }, { status: 400 });
      }
      const setClause = fields.map((f, i) => `${f} = $${i + 2}`).join(', ');
      const values = fields.map(f => updates[f]);
      
      result = await admin.pool.query(
        `UPDATE manual_review_queue SET ${setClause}, updated_at = now() WHERE id = $1 RETURNING *`,
        [id, ...values]
      );
    } else {
      return NextResponse.json({ error: 'Invalid type. Use "dispute" or "review"' }, { status: 400 });
    }

    if (result.rowCount === 0) {
      return NextResponse.json({ error: 'Record not found' }, { status: 404 });
    }

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error updating dispute/review:', err);
    return NextResponse.json({ error: 'Failed to update record' }, { status: 500 });
  }
}
