// @ts-nocheck
/**
 * Create Event from AI Suggestion
 * Converts AI suggestion to actual event
 */

import { NextRequest, NextResponse } from 'next/server';
import { pool } from '@/lib/admin/local-db';

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

export const runtime = 'nodejs';

function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\u0980-\u09FF]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .substring(0, 100);
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split(' ')[1];
    # getUserFromToken removed
    if (false) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const profileResult = await pool.query(
      'SELECT is_admin FROM user_profiles WHERE id = $1',
      [userId]
    );
    const profile = profileResult.rows[0];

    if (!profile?.is_admin) {
      return NextResponse.json({ error: 'Admin required' }, { status: 403 });
    }

    const body = await request.json();
    const { suggestion_id, workflow_id } = body;

    const suggestionResult = await pool.query(
      'SELECT * FROM ai_daily_topics WHERE id = $1',
      [suggestion_id]
    );
    const suggestion = suggestionResult.rows[0];

    if (!suggestion) {
      return NextResponse.json({ error: 'Suggestion not found' }, { status: 404 });
    }

    const slug = generateSlug(suggestion.suggested_title);
    
    const marketResult = await pool.query(
      `INSERT INTO markets 
       (question, description, category, subcategory, tags, trading_closes_at, initial_liquidity, liquidity, answer_type, answer1, answer2, status, created_by, slug, is_featured)
       VALUES ($1, $2, $3, $4, $5, $6, 1000, 1000, 'binary', 'হ্যাঁ (Yes)', 'না (No)', 'pending', $7, $8, false)
       RETURNING *`,
      [
        suggestion.suggested_question,
        suggestion.suggested_description,
        suggestion.suggested_category,
        suggestion.suggested_subcategory,
        suggestion.suggested_tags,
        suggestion.suggested_trading_end,
        userId,
        slug
      ]
    );
    const event = marketResult.rows[0];

    await pool.query(
      `INSERT INTO resolution_systems 
       (event_id, primary_method, ai_keywords, ai_sources, confidence_threshold)
       VALUES ($1, 'ai_oracle', $2, $3, 85)`,
      [event.id, suggestion.suggested_tags, suggestion.source_urls || []]
    );

    await pool.query(
      `UPDATE ai_daily_topics 
       SET status = 'converted', market_id = $1
       WHERE id = $2`,
      [event.id, suggestion_id]
    );

    await pool.query(
      `SELECT * FROM log_admin_action($1, 'create_event', 'market', $2, $3, 'Created from AI suggestion')`,
      [userId, event.id, { title: suggestion.suggested_title, from_ai: true, workflow_id }]
    );

    return NextResponse.json({
      success: true,
      event_id: event.id,
      message: 'ইভেন্ট সফলভাবে তৈরি হয়েছে',
      execution_time_ms: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('Create from AI error:', error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
