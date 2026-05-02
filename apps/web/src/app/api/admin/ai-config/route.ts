// @ts-nocheck
import { NextRequest, NextResponse } from 'next/server';
import { pool, query } from '@/lib/admin/local-db';

/**
 * Auth helper: validate token against cloud Supabase, return user ID.
 */
async function getUserFromToken(token: string): Promise<string | null> {
    const cloudUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://sltcfmqefujecqfbmkvz.supabase.co';
    const cloudRes = await fetch(`${cloudUrl}/auth/v1/user`, {
        headers: {
            'Authorization': `Bearer ${token}`,
            'apikey': process.env.SUPABASE_ANON_KEY || ''
        }
    });
    if (!cloudRes.ok) return null;
    const userData = await cloudRes.json();
    return userData?.id || null;
}

async function checkAdmin(token: string): Promise<{ isSuperAdmin: boolean; userId: string } | null> {
    const userId = await getUserFromToken(token);
    if (!userId) return null;
    const profiles = await query<{ is_super_admin: boolean }>(
        'SELECT is_super_admin FROM user_profiles WHERE id = $1',
        [userId]
    );
    if (!profiles[0]?.is_super_admin) return null;
    return { isSuperAdmin: true, userId };
}

export async function GET(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = await checkAdmin(authHeader.split(' ')[1]);
        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
        }

        // Fetch AI providers
        const providers = await query(
            'SELECT * FROM ai_providers ORDER BY provider_name'
        );

        // Fetch AI prompts
        const prompts = await query(
            'SELECT * FROM ai_prompts ORDER BY agent_name'
        );

        // Fetch legacy settings
        const settings = await query(
            'SELECT * FROM admin_ai_settings LIMIT 1'
        );

        return NextResponse.json({
            success: true,
            providers: providers || [],
            prompts: prompts || [],
            settings: settings[0] || null
        });
    } catch (error: any) {
        console.error('[AI Config API GET] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const admin = await checkAdmin(authHeader.split(' ')[1]);
        if (!admin) {
            return NextResponse.json({ error: 'Forbidden - Super Admin required' }, { status: 403 });
        }

        const body = await req.json();
        const { type, data } = body;

        // Handle legacy settings updates (backward compat)
        if (!type && body.updated_by) {
            const { custom_instruction, target_region, default_categories, auto_generate_enabled, auto_generate_time, max_daily_topics, gemini_model } = body;

            const updates: string[] = [];
            const values: any[] = [];
            let i = 1;

            if (custom_instruction !== undefined) { updates.push(`custom_instruction = $${i++}`); values.push(custom_instruction); }
            if (target_region !== undefined) { updates.push(`target_region = $${i++}`); values.push(target_region); }
            if (default_categories !== undefined) { updates.push(`default_categories = $${i++}`); values.push(default_categories); }
            if (auto_generate_enabled !== undefined) { updates.push(`auto_generate_enabled = $${i++}`); values.push(auto_generate_enabled); }
            if (auto_generate_time !== undefined) { updates.push(`auto_generate_time = $${i++}`); values.push(auto_generate_time); }
            if (max_daily_topics !== undefined) { updates.push(`max_daily_topics = $${i++}`); values.push(max_daily_topics); }
            if (gemini_model !== undefined) { updates.push(`gemini_model = $${i++}`); values.push(gemini_model); }
            updates.push(`updated_by = $${i++}`); values.push(admin.userId);
            updates.push(`updated_at = NOW()`);

            values.push(1); // WHERE id = 1

            const result = await pool.query(
                `UPDATE admin_ai_settings SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
                values
            );

            return NextResponse.json({
                success: true,
                settings: result.rows[0],
                message: 'Legacy AI settings updated successfully'
            });
        }

        if (!type || !data) {
            return NextResponse.json({ error: 'Bad Request: Missing type or data' }, { status: 400 });
        }

        if (type === 'provider') {
            const { id, provider_name, model, base_url, temperature, max_tokens, is_active } = data;

            const updates: string[] = [];
            const values: any[] = [];
            let i = 1;

            if (model !== undefined) { updates.push(`model = $${i++}`); values.push(model); }
            if (base_url !== undefined) { updates.push(`base_url = $${i++}`); values.push(base_url); }
            if (temperature !== undefined) { updates.push(`temperature = $${i++}`); values.push(temperature); }
            if (max_tokens !== undefined) { updates.push(`max_tokens = $${i++}`); values.push(max_tokens); }
            if (is_active !== undefined) { updates.push(`is_active = $${i++}`); values.push(is_active); }
            updates.push(`updated_at = NOW()`);
            updates.push(`updated_by = $${i++}`);
            values.push(admin.userId);
            values.push(id);

            const result = await pool.query(
                `UPDATE ai_providers SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
                values
            );

            return NextResponse.json({ success: true, data: result.rows[0] });

        } else if (type === 'prompt') {
            const { id, system_prompt, is_active } = data;

            const updates: string[] = [];
            const values: any[] = [];
            let i = 1;

            if (system_prompt !== undefined) { updates.push(`system_prompt = $${i++}`); values.push(system_prompt); }
            if (is_active !== undefined) { updates.push(`is_active = $${i++}`); values.push(is_active); }
            updates.push(`updated_at = NOW()`);
            updates.push(`updated_by = $${i++}`);
            values.push(admin.userId);
            values.push(id);

            const result = await pool.query(
                `UPDATE ai_prompts SET ${updates.join(', ')} WHERE id = $${i} RETURNING *`,
                values
            );

            return NextResponse.json({ success: true, data: result.rows[0] });

        } else {
            return NextResponse.json({ error: 'Bad Request: Invalid type' }, { status: 400 });
        }

    } catch (error: any) {
        console.error('[AI Config API POST] Error:', error);
        return NextResponse.json(
            { success: false, error: error.message || 'Internal Server Error' },
            { status: 500 }
        );
    }
}
