/**
 * GET /api/admin/disputes - List dispute records and manual review queue
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
  const tab = searchParams.get('tab') || 'disputes';
  const status = searchParams.get('status');

  try {
    if (tab === 'reviews') {
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

      const result = await adminPool.query(query, params);
      return NextResponse.json({ data: result.rows });
    } else {
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

      const result = await adminPool.query(query, params);
      return NextResponse.json({ data: result.rows });
    }
  } catch (err) {
    console.error('Error fetching disputes:', err);
    return NextResponse.json({ error: 'Failed to fetch disputes' }, { status: 500 });
  }
}
