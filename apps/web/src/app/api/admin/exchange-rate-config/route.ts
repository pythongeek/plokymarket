import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * GET /api/admin/exchange-rate-config
 * Get current exchange rate configuration (admin only)
 *
 * POST /api/admin/exchange-rate-config
 * Update exchange rate configuration (admin only)
 */

async function verifyAdmin(supabase: any) {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error || !user) return null;

    const { data: profile } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .single();

    if (!profile?.is_admin) return null;
    return user;
}

export async function GET() {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Get config (try new table first, fallback to defaults)
        let config = null;
        try {
            const { data: newConfig } = await (supabase as any)
                .from('exchange_rate_config')
                .select('*')
                .eq('id', 1)
                .single();

            if (newConfig) {
                config = newConfig;
            }
        } catch (e) {
            // Table doesn't exist, use defaults
            console.log('Using default exchange rate config');
        }

        // If no config, use defaults
        if (!config) {
            config = {
                default_usdt_to_bdt: 119,
                min_usdt_to_bdt: 95,
                max_usdt_to_bdt: 130,
                auto_update_enabled: false,
                update_interval_minutes: 5,
            };
        }

        // Get current live rate (try new table first, fallback to legacy)
        let liveRate = null;
        try {
            const { data: newLiveRate } = await (supabase as any)
                .from('exchange_rates_live')
                .select('*')
                .eq('is_active', true)
                .order('fetched_at', { ascending: false })
                .limit(1)
                .single();

            if (newLiveRate) {
                liveRate = newLiveRate;
            }
        } catch (e) {
            // Fallback to legacy exchange_rates table
            try {
                const { data: legacyRate } = await (supabase as any)
                    .from('exchange_rates')
                    .select('*')
                    .order('effective_from', { ascending: false })
                    .limit(1)
                    .single();

                if (legacyRate) {
                    liveRate = {
                        usdt_to_bdt: legacyRate.usdt_to_bdt,
                        bdt_to_usdt: legacyRate.bdt_to_usdt,
                        source: legacyRate.source || 'binance',
                        fetched_at: legacyRate.effective_from || legacyRate.created_at,
                        is_active: true
                    };
                }
            } catch (legacyError) {
                console.warn('Could not fetch legacy rate:', legacyError);
            }
        }

        // Get last 20 rate history entries
        const { data: history } = await (supabase as any)
            .from('exchange_rate_history')
            .select('*')
            .order('recorded_at', { ascending: false })
            .limit(20);

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
            history: history || [],
        });
    } catch (error: any) {
        console.error('[Admin Exchange Rate Config] GET error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: NextRequest) {
    try {
        const supabase = await createClient();
        const user = await verifyAdmin(supabase);
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const {
            default_usdt_to_bdt,
            min_usdt_to_bdt,
            max_usdt_to_bdt,
            auto_update_enabled,
            update_interval_minutes,
            manual_rate, // Optional: admin can set a manual rate immediately
        } = body;

        // Validate bounds
        if (min_usdt_to_bdt && max_usdt_to_bdt && min_usdt_to_bdt >= max_usdt_to_bdt) {
            return NextResponse.json({ error: 'Min rate must be less than max rate' }, { status: 400 });
        }

        // Update config (try new table first, but might not exist)
        const updatePayload: Record<string, any> = {};
        if (default_usdt_to_bdt !== undefined) updatePayload.default_usdt_to_bdt = default_usdt_to_bdt;
        if (min_usdt_to_bdt !== undefined) updatePayload.min_usdt_to_bdt = min_usdt_to_bdt;
        if (max_usdt_to_bdt !== undefined) updatePayload.max_usdt_to_bdt = max_usdt_to_bdt;
        if (auto_update_enabled !== undefined) updatePayload.auto_update_enabled = auto_update_enabled;
        if (update_interval_minutes !== undefined) updatePayload.update_interval_minutes = update_interval_minutes;
        updatePayload.last_updated = new Date().toISOString();
        updatePayload.updated_by = user.id;

        try {
            const { error: updateError } = await (supabase as any)
                .from('exchange_rate_config')
                .update(updatePayload)
                .eq('id', 1);

            if (updateError && !updateError.message?.includes('does not exist')) {
                console.error('[Admin Exchange Rate Config] Update error:', updateError);
                return NextResponse.json({ error: 'Failed to update config' }, { status: 500 });
            }
        } catch (tableError: any) {
            // Table doesn't exist - just log and continue
            console.log('[Admin Exchange Rate Config] Table not found, using in-memory config');
        }

        // If admin provided a manual rate, update the rate immediately
        if (manual_rate && typeof manual_rate === 'number' && manual_rate > 0) {
            const min = min_usdt_to_bdt || 95;
            const max = max_usdt_to_bdt || 130;

            if (manual_rate < min || manual_rate > max) {
                return NextResponse.json({
                    error: `Manual rate ${manual_rate} is outside bounds (${min}-${max})`,
                }, { status: 400 });
            }

            // Try new exchange_rates_live table first
            try {
                // Deactivate old rates
                await (supabase as any)
                    .from('exchange_rates_live')
                    .update({ is_active: false })
                    .eq('is_active', true);

                // Insert new manual rate
                await (supabase as any)
                    .from('exchange_rates_live')
                    .insert({
                        usdt_to_bdt: manual_rate,
                        bdt_to_usdt: parseFloat((1 / manual_rate).toFixed(6)),
                        source: 'admin_manual',
                        is_active: true,
                        fetched_at: new Date().toISOString(),
                        expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
                    });

                // Record in history
                await (supabase as any)
                    .from('exchange_rate_history')
                    .insert({
                        usdt_to_bdt: manual_rate,
                        bdt_to_usdt: parseFloat((1 / manual_rate).toFixed(6)),
                        source: 'admin_manual',
                    });
            } catch (newTableError) {
                // Fallback to legacy exchange_rates table
                try {
                    // Deactivate old rates
                    await (supabase as any)
                        .from('exchange_rates')
                        .update({ is_active: false })
                        .eq('is_active', true);

                    // Insert new manual rate into legacy table
                    await (supabase as any)
                        .from('exchange_rates')
                        .insert({
                            usdt_to_bdt: manual_rate,
                            bdt_to_usdt: parseFloat((1 / manual_rate).toFixed(6)),
                            effective_from: new Date().toISOString(),
                            source: 'admin_manual',
                        });
                } catch (legacyError) {
                    console.error('Failed to insert manual rate:', legacyError);
                }
            }
        }

        return NextResponse.json({
            success: true,
            message: 'Exchange rate configuration updated',
        });
    } catch (error: any) {
        console.error('[Admin Exchange Rate Config] POST error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
