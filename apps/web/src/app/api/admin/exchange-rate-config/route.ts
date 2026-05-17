/**
 * API Route: /api/admin/exchange-rate-config
 * Get and update exchange rate configuration (admin only)
 */

import { pool, query } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';
import { NextRequest, NextResponse } from 'next/server';

interface ExchangeRateConfig {
  id: number;
  default_usdt_to_bdt: number;
  min_usdt_to_bdt: number;
  max_usdt_to_bdt: number;
  auto_update_enabled: boolean;
  update_interval_minutes: number;
}

export async function GET(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;

  try {
    let config: ExchangeRateConfig | null = null;
    try {
      const configResult = await pool.query<ExchangeRateConfig>(
        'SELECT * FROM exchange_rate_config WHERE id = 1'
      );
      if (configResult.rows.length > 0) {
        config = configResult.rows[0];
      }
    } catch (e) {
      console.log('Using default exchange rate config');
    }

    if (!config) {
      config = {
        id: 1,
        default_usdt_to_bdt: 119,
        min_usdt_to_bdt: 95,
        max_usdt_to_bdt: 130,
        auto_update_enabled: false,
        update_interval_minutes: 5,
      };
    }

    let liveRate = null;
    try {
      const liveRateResult = await pool.query(
        'SELECT * FROM exchange_rates_live WHERE is_active = true ORDER BY fetched_at DESC LIMIT 1'
      );
      if (liveRateResult.rows.length > 0) {
        liveRate = liveRateResult.rows[0];
      }
    } catch (e) {
      try {
        const legacyResult = await pool.query(
          'SELECT * FROM exchange_rates ORDER BY effective_from DESC LIMIT 1'
        );
        if (legacyResult.rows.length > 0) {
          const legacyRate = legacyResult.rows[0];
          liveRate = {
            usdt_to_bdt: legacyRate.usdt_to_bdt,
            bdt_to_usdt: legacyRate.bdt_to_usdt,
            source: legacyRate.source || 'binance',
            fetched_at: legacyRate.effective_from || legacyRate.created_at,
            is_active: true,
          };
        }
      } catch (legacyError) {
        console.warn('Could not fetch legacy rate:', legacyError);
      }
    }

    const historyResult = await pool.query(
      'SELECT * FROM exchange_rate_history ORDER BY recorded_at DESC LIMIT 20'
    );

    return NextResponse.json({
      success: true,
      config: config || {
        default_usdt_to_bdt: 119,
        min_usdt_to_bdt: 95,
        max_usdt_to_bdt: 130,
        auto_update_enabled: false,
        update_interval_minutes: 5,
      },
      liveRate: liveRate || null,
      history: historyResult.rows || [],
    });
  } catch (error: any) {
    console.error('[Admin Exchange Rate Config] GET error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  const authResult = await requireAdminUser(req);
  if ('error' in authResult) return authResult.error;
  const userId = authResult.user.id;

  try {
    const profiles = await query<{ is_admin: boolean }>(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    if (!profiles[0]?.is_admin) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const {
      default_usdt_to_bdt,
      min_usdt_to_bdt,
      max_usdt_to_bdt,
      auto_update_enabled,
      update_interval_minutes,
      manual_rate,
    } = body;

    if (min_usdt_to_bdt !== undefined && max_usdt_to_bdt !== undefined && min_usdt_to_bdt >= max_usdt_to_bdt) {
      return NextResponse.json({ error: 'Min rate must be less than max rate' }, { status: 400 });
    }

    const updates: Record<string, any> = {};
    if (default_usdt_to_bdt !== undefined) updates.default_usdt_to_bdt = default_usdt_to_bdt;
    if (min_usdt_to_bdt !== undefined) updates.min_usdt_to_bdt = min_usdt_to_bdt;
    if (max_usdt_to_bdt !== undefined) updates.max_usdt_to_bdt = max_usdt_to_bdt;
    if (auto_update_enabled !== undefined) updates.auto_update_enabled = auto_update_enabled;
    if (update_interval_minutes !== undefined) updates.update_interval_minutes = update_interval_minutes;
    updates.last_updated = new Date().toISOString();
    updates.updated_by = userId;

    try {
      const setClause = Object.keys(updates).map((k, i) => `${k} = $${i + 1}`).join(', ');
      const values = [...Object.values(updates), 1];
      await pool.query(
        `UPDATE exchange_rate_config SET ${setClause} WHERE id = $${values.length}`,
        values
      );
    } catch (tableError: any) {
      console.log('[Admin Exchange Rate Config] Table not found, using in-memory config');
    }

    if (manual_rate && typeof manual_rate === 'number' && manual_rate > 0) {
      const min = min_usdt_to_bdt || 95;
      const max = max_usdt_to_bdt || 130;

      if (manual_rate < min || manual_rate > max) {
        return NextResponse.json(
          { error: `Manual rate ${manual_rate} is outside bounds (${min}-${max})` },
          { status: 400 }
        );
      }

      try {
        await pool.query('UPDATE exchange_rates_live SET is_active = false WHERE is_active = true');
        await pool.query(
          `INSERT INTO exchange_rates_live
            (usdt_to_bdt, bdt_to_usdt, source, is_active, fetched_at, expires_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [
            manual_rate,
            parseFloat((1 / manual_rate).toFixed(6)),
            'admin_manual',
            true,
            new Date().toISOString(),
            new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          ]
        );
        await pool.query(
          `INSERT INTO exchange_rate_history (usdt_to_bdt, bdt_to_usdt, source) VALUES ($1, $2, $3)`,
          [manual_rate, parseFloat((1 / manual_rate).toFixed(6)), 'admin_manual']
        );
      } catch (newTableError) {
        try {
          await pool.query('UPDATE exchange_rates SET is_active = false WHERE is_active = true');
          await pool.query(
            `INSERT INTO exchange_rates
              (usdt_to_bdt, bdt_to_usdt, effective_from, source, is_active)
             VALUES ($1, $2, $3, $4, $5)`,
            [
              manual_rate,
              parseFloat((1 / manual_rate).toFixed(6)),
              new Date().toISOString(),
              'admin_manual',
              true,
            ]
          );
        } catch (legacyError) {
          console.error('Failed to insert manual rate:', legacyError);
        }
      }
    }

    return NextResponse.json({ success: true, message: 'Exchange rate configuration updated' });
  } catch (error: any) {
    console.error('[Admin Exchange Rate Config] POST error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
