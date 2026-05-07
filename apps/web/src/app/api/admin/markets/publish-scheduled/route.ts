import { NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

/**
 * GET /api/admin/markets/publish-scheduled
 * Auto-publish markets that are scheduled and whose starts_at has passed.
 * Called by cron job or admin action.
 */
export async function GET() {
  try {
    const result = await pool.query(
      `UPDATE markets
       SET status = 'active', publish_status = 'active', updated_at = NOW()
       WHERE publish_status = 'scheduled'
         AND starts_at IS NOT NULL
         AND starts_at <= NOW()
         AND status != 'active'
       RETURNING id, question, starts_at`
    );

    const published = result.rows;

    // Log to audit log
    if (published.length > 0) {
      for (const m of published) {
        await pool.query(
          `INSERT INTO admin_audit_log (action, performed_by, target_table, target_id, details, created_at)
           VALUES ('AUTO_PUBLISH', NULL, 'markets', $1, $2, NOW())`,
          [m.id, JSON.stringify({ question: m.question, starts_at: m.starts_at })]
        );
      }
    }

    return NextResponse.json({
      success: true,
      published: published.length,
      markets: published,
    });
  } catch (error: any) {
    console.error('[PublishScheduled]', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
