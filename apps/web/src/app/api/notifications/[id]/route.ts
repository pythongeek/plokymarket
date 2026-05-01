/**
 * Individual Notification API
 * Phase 4 - REST API for single notification operations
 * 
 * PATCH /api/notifications/[id] - Update a notification (mark as read)
 * DELETE /api/notifications/[id] - Delete a notification
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { verifyAuth } from '@/lib/auth/verifyAuth';

interface RouteParams {
  params: Promise<{ id: string }>;
}

// PATCH /api/notifications/[id] - Mark as read
export async function PATCH(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { read } = body;

    // Verify ownership
    const { data: existing } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update
    const { data, error } = await supabase
      .from('notifications')
      .update({ read: read ?? true })
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating notification:', error);
      return NextResponse.json({ error: 'Failed to update notification' }, { status: 500 });
    }

    return NextResponse.json({ notification: data });

  } catch (error) {
    console.error('Error in notification PATCH:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// DELETE /api/notifications/[id] - Delete notification
export async function DELETE(request: NextRequest, { params }: RouteParams) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Verify ownership
    const { data: existing } = await supabase
      .from('notifications')
      .select('user_id')
      .eq('id', id)
      .single();

    if (!existing) {
      return NextResponse.json({ error: 'Notification not found' }, { status: 404 });
    }

    if (existing.user_id !== user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete
    const { error } = await supabase
      .from('notifications')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting notification:', error);
      return NextResponse.json({ error: 'Failed to delete notification' }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error in notification DELETE:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
