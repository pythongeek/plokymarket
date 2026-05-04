// @ts-nocheck
/**
 * Event Creation API (POST only)
 *
 * DELEGATES to the atomic RPC: create_event_complete()
 * which handles event_definitions + markets creation in one transaction.
 *
 * Auth: Local JWT validated via requireAdminUser (jose)
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';
import { requireAdminUser } from '@/lib/admin/admin-auth';

function validateEvent(body: any) {
    if (!body.title?.trim() || body.title.trim().length < 5)
        return { error: 'Title must be at least 5 characters' };
    if (!body.question?.trim())
        return { error: 'Question is required' };
    if (!body.category?.trim())
        return { error: 'Category is required' };
    if (!body.trading_closes_at)
        return { error: 'trading_closes_at is required' };
    const tradingClosesAt = new Date(body.trading_closes_at);
    if (isNaN(tradingClosesAt.getTime()))
        return { error: 'Invalid trading_closes_at date' };
    return { valid: true };
}

export async function POST(req: NextRequest) {
    // ─── AUTH (local JWT) ─────────────────────────────────────────────────────
    const authResult = await requireAdminUser(req);
    if ('error' in authResult) return authResult.error;
    const userId = authResult.user.id;

    // Validate
    const body = await req.json().catch(() => null);
    if (!body) return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    const validation = validateEvent(body);
    if (validation.error) return NextResponse.json({ error: validation.error }, { status: 400 });

    // Build RPC payload (matches create_event_complete JSONB contract)
    const rpcPayload = {
        title:         body.title.trim(),
        question:      body.question.trim(),
        description:   body.description?.trim() || '',
        category:      (body.category || 'Other').toLowerCase(),
        tags:          Array.isArray(body.tags) ? body.tags : [],
        ai_keywords:   Array.isArray(body.ai_keywords) ? body.ai_keywords : [],
        ai_sources:    Array.isArray(body.ai_sources) ? body.ai_sources : [],
        trading_closes_at: new Date(body.trading_closes_at).toISOString(),
        resolution_method: body.resolution_method || 'manual_admin',
        resolution_source: body.resolution_source || '',
        status:        'active',
        is_featured:   !!body.is_featured,
        initial_liquidity: parseFloat(body.initial_liquidity) || 1000,
        answer_type:   'binary',
    };

    // Call atomic RPC
    const rpcResult = await pool.query(
        'SELECT create_event_complete($1, $2) AS result',
        [JSON.stringify(rpcPayload), userId]
    );
    const rpcOutput = rpcResult.rows[0]?.result;

    if (!rpcOutput?.success) {
        return NextResponse.json(
            { success: false, error: rpcOutput?.message || 'RPC failed' },
            { status: 500 }
        );
    }

    // Get market_id from event_definitions (it back-links to markets)
    const eventRow = await pool.query(
        'SELECT market_id FROM event_definitions WHERE id = $1',
        [rpcOutput.event_id]
    );

    return NextResponse.json({
        success:    true,
        event_id:   rpcOutput.event_id,
        market_id:  rpcOutput.market_id || eventRow.rows[0]?.market_id || null,
        slug:       rpcOutput.slug,
        message:    rpcOutput.message,
    }, { status: 201 });
}
