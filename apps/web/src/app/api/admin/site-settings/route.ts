/**
 * API Route: /api/admin/site-settings
 * Get and update site-wide settings with validation and audit logging
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

// Numeric settings that must be validated as percentages (0-100)
const PERCENTAGE_KEYS = ['global_trading_fee', 'global_maker_rebate'];
// Numeric settings that must be >= 0
const NON_NEGATIVE_KEYS = ['min_spread_for_reward'];

// All known fee/rebate keys
const KNOWN_KEYS = [
  'global_trading_fee',
  'global_maker_rebate',
  'min_spread_for_reward',
  'trading_paused',
  'maintenance_mode',
  'max_leverage',
  'min_order_size',
];

interface SiteSetting {
  id: string;
  setting_value: string | number | boolean;
  updated_by: string | null;
  updated_at: string;
}

// GET /api/admin/site-settings
export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    const result = await pool.query<SiteSetting>('SELECT * FROM site_settings');
    const settings = result.rows;

    // Convert array to key-value object with type inference
    const settingsObj: Record<string, string | number | boolean> = {};
    settings.forEach((s) => {
      const raw = s.setting_value;
      // Try to parse booleans and numbers
      if (raw === 'true') settingsObj[s.id] = true;
      else if (raw === 'false') settingsObj[s.id] = false;
      else if (!isNaN(Number(raw)) && raw !== '') settingsObj[s.id] = Number(raw);
      else settingsObj[s.id] = raw;
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error('[SiteSettings GET]', error);
    return NextResponse.json({ error: 'Failed to fetch settings' }, { status: 500 });
  }
}

// PUT /api/admin/site-settings
export async function PUT(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;
  const userId = authResult.user.id;

  try {
    const body = await req.json();
    const { key, value } = body;

    if (!key || value === undefined) {
      return NextResponse.json({ error: 'Missing key or value' }, { status: 400 });
    }

    // Validate known keys
    if (!KNOWN_KEYS.includes(key)) {
      return NextResponse.json(
        { error: `Unknown setting key: ${key}. Allowed: ${KNOWN_KEYS.join(', ')}` },
        { status: 400 }
      );
    }

    // Type validation for numeric keys
    if (PERCENTAGE_KEYS.includes(key)) {
      const num = Number(value);
      if (isNaN(num) || num < 0 || num > 100) {
        return NextResponse.json(
          { error: `${key} must be a number between 0 and 100` },
          { status: 400 }
        );
      }
    }
    if (NON_NEGATIVE_KEYS.includes(key)) {
      const num = Number(value);
      if (isNaN(num) || num < 0) {
        return NextResponse.json(
          { error: `${key} must be a non-negative number` },
          { status: 400 }
        );
      }
    }

    // Fetch old value for audit
    const oldResult = await pool.query<SiteSetting>(
      'SELECT setting_value FROM site_settings WHERE id = $1',
      [key]
    );
    const oldValue = oldResult.rows[0]?.setting_value ?? null;

    // Upsert setting
    const updateResult = await pool.query<SiteSetting>(
      `INSERT INTO site_settings (id, setting_value, updated_by, updated_at)
       VALUES ($1, $2, $3, NOW())
       ON CONFLICT (id)
       DO UPDATE SET setting_value = $2, updated_by = $3, updated_at = NOW()
       RETURNING *`,
      [key, String(value), userId]
    );

    if (updateResult.rowCount === 0) {
      return NextResponse.json({ error: 'Setting not found' }, { status: 404 });
    }

    // Audit log
    try {
      await pool.query(
        `INSERT INTO admin_audit_log (admin_id, action, entity_type, entity_id, old_value, new_value, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          userId,
          'UPDATE',
          'site_setting',
          key,
          oldValue !== null ? String(oldValue) : null,
          String(value),
        ]
      );
    } catch (auditErr) {
      console.error('[SiteSettings PUT] Audit log failed:', auditErr);
      // Non-blocking: setting was saved
    }

    return NextResponse.json({ success: true, key, value });
  } catch (error) {
    console.error('[SiteSettings PUT]', error);
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 });
  }
}
