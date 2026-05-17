/**
 * GET /api/admin/experts - List expert panel members and votes
 */
import { NextRequest, NextResponse } from 'next/server';
import { admin } from '@/lib/admin/auth-guard';

export async function GET(req: NextRequest) {
  const adminResult = await admin();
  if (adminResult.error) {
    return adminResult.error;
  }
  const adminPool = adminResult.pool;

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
      const result = await adminPool.query(query, params);
      return NextResponse.json({ data: result.rows });
    } else if (tab === 'reviews') {
      const result = await adminPool.query(`
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
      const result = await adminPool.query(`
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
  const adminResult = await admin();
  if (adminResult.error) {
    return adminResult.error;
  }
  const adminPool = adminResult.pool;

  try {
    const body = await req.json();
    const { user_id, expert_name, specializations, reputation_score } = body;

    const result = await adminPool.query(
      `INSERT INTO expert_panel (user_id, expert_name, specializations, reputation_score, created_at)
       VALUES ($1, $2, $3, $4, NOW())
       RETURNING *`,
      [user_id, expert_name, specializations || [], reputation_score || 0]
    );

    return NextResponse.json({ data: result.rows[0] });
  } catch (err) {
    console.error('Error adding expert:', err);
    return NextResponse.json({ error: 'Failed to add expert' }, { status: 500 });
  }
}
