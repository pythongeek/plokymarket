/**
 * API Route: /api/admin/rebate-tiers
 * Manage maker rebate tier configuration
 * GET: List all tiers
 * POST: Create or update a tier
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

interface RebateTier {
  id: number;
  tier_name: string;
  min_volume: number;
  max_volume: number | null;
  rebate_rate: number;
  min_spread: number;
  benefits: Record<string, any>;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// GET /api/admin/rebate-tiers
export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const result = await pool.query<RebateTier>(
      'SELECT * FROM rebate_tiers_config ORDER BY id ASC'
    );
    return NextResponse.json({ success: true, tiers: result.rows });
  } catch (error: any) {
    console.error('[RebateTiers GET]', error);
    return NextResponse.json({ error: 'Failed to fetch rebate tiers' }, { status: 500 });
  }
}

// POST /api/admin/rebate-tiers
export async function POST(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;
  const userId = authResult.user.id;

  try {
    const body = await req.json();
    const {
      id,
      tier_name,
      min_volume,
      max_volume,
      rebate_rate,
      min_spread,
      benefits,
      is_active,
    } = body;

    // Validation
    if (!tier_name || typeof tier_name !== 'string' || tier_name.length < 1) {
      return NextResponse.json({ error: 'tier_name is required' }, { status: 400 });
    }
    if (min_volume === undefined || isNaN(Number(min_volume)) || Number(min_volume) < 0) {
      return NextResponse.json({ error: 'min_volume must be a non-negative number' }, { status: 400 });
    }
    if (rebate_rate === undefined || isNaN(Number(rebate_rate)) || Number(rebate_rate) < 0 || Number(rebate_rate) > 100) {
      return NextResponse.json({ error: 'rebate_rate must be between 0 and 100' }, { status: 400 });
    }
    if (min_spread !== undefined && (isNaN(Number(min_spread)) || Number(min_spread) < 0)) {
      return NextResponse.json({ error: 'min_spread must be a non-negative number' }, { status: 400 });
    }

    if (id) {
      // Update existing tier
      const result = await pool.query<RebateTier>(
        `UPDATE rebate_tiers_config
         SET tier_name = $1, min_volume = $2, max_volume = $3, rebate_rate = $4,
             min_spread = $5, benefits = $6, is_active = $7, updated_at = NOW()
         WHERE id = $8
         RETURNING *`,
        [tier_name, min_volume, max_volume || null, rebate_rate, min_spread || 0, JSON.stringify(benefits || {}), is_active !== false, id]
      );

      if (result.rowCount === 0) {
        return NextResponse.json({ error: 'Tier not found' }, { status: 404 });
      }

      // Audit log
      try {
        await pool.query(
          `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, new_value, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [userId, 'UPDATE', 'rebate_tier', String(id), JSON.stringify(result.rows[0])]
        );
      } catch (auditErr) {
        console.error('[RebateTiers POST] Audit log failed:', auditErr);
      }

      return NextResponse.json({ success: true, tier: result.rows[0] });
    } else {
      // Create new tier
      const result = await pool.query<RebateTier>(
        `INSERT INTO rebate_tiers_config
         (tier_name, min_volume, max_volume, rebate_rate, min_spread, benefits, is_active, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
         RETURNING *`,
        [tier_name, min_volume, max_volume || null, rebate_rate, min_spread || 0, JSON.stringify(benefits || {}), is_active !== false]
      );

      // Audit log
      try {
        await pool.query(
          `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, new_value, created_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [userId, 'CREATE', 'rebate_tier', String(result.rows[0].id), JSON.stringify(result.rows[0])]
        );
      } catch (auditErr) {
        console.error('[RebateTiers POST] Audit log failed:', auditErr);
      }

      return NextResponse.json({ success: true, tier: result.rows[0] }, { status: 201 });
    }
  } catch (error: any) {
    console.error('[RebateTiers POST]', error);
    return NextResponse.json({ error: 'Failed to save rebate tier' }, { status: 500 });
  }
}
