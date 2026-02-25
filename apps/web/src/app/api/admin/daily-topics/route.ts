/**
 * Admin API for AI Daily Topics Management
 * List, approve, reject, and delete topics
 */

import { NextResponse } from 'next/server';
import { createServiceClient } from '@/lib/supabase/server';

export const runtime = 'edge';

// Verify admin authentication
async function verifyAdmin(request: Request): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization');

  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing authorization header' };
  }

  const token = authHeader.split(' ')[1];

  const supabase = await createServiceClient();

  const { data: { user }, error } = await supabase.auth.getUser(token);

  if (error || !user) {
    return { isAdmin: false, error: 'Invalid token' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if ((profile as any)?.role !== 'admin') {
    return { isAdmin: false, error: 'Not an admin' };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * GET /api/admin/daily-topics
 * List all AI daily topics with filtering
 */
export async function GET(request: Request) {
  const adminCheck = await verifyAdmin(request);

  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const supabase = await createServiceClient() as any;

    let query = supabase
      .from('ai_daily_topics')
      .select('*', { count: 'exact' })
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (status) {
      query = query.eq('status', status);
    }

    if (category) {
      query = query.eq('category', category);
    }

    const { data, error, count } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      topics: data || [],
      total: count || 0,
      limit,
      offset
    });

  } catch (error: any) {
    console.error('[Admin DailyTopics] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/daily-topics
 * Approve a topic and create market
 */
export async function POST(request: Request) {
  const adminCheck = await verifyAdmin(request);

  if (!adminCheck.isAdmin || !adminCheck.userId) {
    return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { topic_id, action, market_data } = body;

    if (!topic_id || !action) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const supabase = await createServiceClient() as any;

    if (action === 'approve') {
      // Get topic details
      const { data: topic, error: topicError } = await supabase
        .from('ai_daily_topics')
        .select('*')
        .eq('id', topic_id)
        .single();

      if (topicError || !topic) {
        return NextResponse.json({ error: 'Topic not found' }, { status: 404 });
      }

      // Create market from topic
      const { data: market, error: marketError } = await supabase
        .from('markets')
        .insert({
          question: topic.title,
          description: topic.description || topic.title,
          category: topic.category,
          trading_closes_at: market_data?.trading_closes_at || topic.trading_end_date,
          event_date: market_data?.event_date || topic.trading_end_date,
          status: 'active',
          creator_id: adminCheck.userId,
          resolution_source_type: 'AI',
          created_at: new Date().toISOString()
        })
        .select()
        .single();

      if (marketError) throw marketError;

      // Update topic status
      await supabase
        .from('ai_daily_topics')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminCheck.userId,
          market_id: market.id
        })
        .eq('id', topic_id);

      return NextResponse.json({
        success: true,
        message: 'Topic approved and market created',
        market
      });

    } else if (action === 'reject') {
      await supabase
        .from('ai_daily_topics')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: adminCheck.userId,
          rejection_reason: body.rejection_reason || null
        })
        .eq('id', topic_id);

      return NextResponse.json({
        success: true,
        message: 'Topic rejected'
      });
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });

  } catch (error: any) {
    console.error('[Admin DailyTopics] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/daily-topics
 * Delete a topic
 */
export async function DELETE(request: Request) {
  const adminCheck = await verifyAdmin(request);

  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const topic_id = searchParams.get('id');

    if (!topic_id) {
      return NextResponse.json({ error: 'Missing topic ID' }, { status: 400 });
    }

    const supabase = await createServiceClient() as any;

    const { error } = await supabase
      .from('ai_daily_topics')
      .delete()
      .eq('id', topic_id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Topic deleted'
    });

  } catch (error: any) {
    console.error('[Admin DailyTopics] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
