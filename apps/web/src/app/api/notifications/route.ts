/**
 * Notifications API
 * Phase 4 - REST API for notifications management
 * 
 * GET /api/notifications - Fetch user notifications
 * POST /api/notifications - Create a new notification
 * PATCH /api/notifications/[id] - Update a notification
 * DELETE /api/notifications/[id] - Delete a notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// GET /api/notifications - Fetch notifications
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const limit = Math.min(parseInt(searchParams.get('limit') || '50'), 100);
    const offset = parseInt(searchParams.get('offset') || '0');
    const unreadOnly = searchParams.get('unread') === 'true';
    const type = searchParams.get('type');

    let query = supabase
      .from('notifications')
      .select('*', { count: 'exact' })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (unreadOnly) {
      query = query.eq('read', false);
    }

    if (type) {
      query = query.eq('type', type);
    }

    const { data, error, count } = await query;

    if (error) {
      console.error('Error fetching notifications:', error);
      return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
    }

    // Get unread count
    const { count: unreadCount } = await supabase
      .from('notifications')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('read', false);

    return NextResponse.json({
      notifications: data,
      total: count,
      unreadCount,
      limit,
      offset,
    });

  } catch (error) {
    console.error('Error in notifications GET:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// POST /api/notifications - Create a notification
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const {
      type,
      title,
      titleBn,
      body: bodyText,
      bodyBn,
      market_id,
      trade_id,
      order_id,
      priority = 'normal',
      action_url,
      metadata,
    } = body;

    // Validate required fields
    if (!type || !title || !bodyText) {
      return NextResponse.json(
        { error: 'Missing required fields: type, title, body' },
        { status: 400 }
      );
    }

    // Insert notification
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: user.id,
        type,
        title,
        title_bn: titleBn || null,
        body: bodyText,
        body_bn: bodyBn || null,
        market_id: market_id || null,
        trade_id: trade_id || null,
        order_id: order_id || null,
        priority,
        action_url: action_url || null,
        metadata: metadata || null,
        read: false,
      })
      .select()
      .single();

    if (error) {
      console.error('Error creating notification:', error);
      return NextResponse.json({ error: 'Failed to create notification' }, { status: 500 });
    }

    return NextResponse.json({ notification: data }, { status: 201 });

  } catch (error) {
    console.error('Error in notifications POST:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
