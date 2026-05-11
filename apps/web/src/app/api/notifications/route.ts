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
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';

// GET /api/notifications - Fetch notifications
const JWT_SECRET = new TextEncoder().encode(
  process.env.NEXT_PUBLIC_JWT_SECRET || 'P10kyM@rket.BD.2026.JWT.SECRET.XX'
);

async function getUserFromRequest(request: Request) {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    try {
      const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
      return { id: payload.sub as string, email: payload.email as string };
    } catch { /* fall through */ }
  }
  const cookie = request.headers.get('cookie') || '';
  const match = cookie.match(/sb-access-token=([^;]+)/);
  const token = match ? decodeURIComponent(match[1]) : null;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET, { clockTolerance: 60 });
    return { id: payload.sub as string, email: payload.email as string };
  } catch { return null; }
}


export async function GET(request: NextRequest) {
  try {
    const supabase = await createPublicClient();
    const user = await getUserFromRequest(request);
    
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
    const supabase = await createPublicClient();
    const user = await getUserFromRequest(request);
    
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
