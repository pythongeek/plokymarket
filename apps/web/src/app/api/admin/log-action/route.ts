/**
 * Admin Log Action API
 * Server-side endpoint for logging admin actions with IP tracking
 * Edge Function for fast response
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';
export const preferredRegion = 'iad1';

const getSupabase = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { persistSession: false, autoRefreshToken: false } }
);

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  
  try {
    const body = await request.json();
    const {
      admin_id,
      action_type,
      resource_type,
      resource_id,
      old_values,
      new_values,
      reason,
      workflow_id
    } = body;

    // Validate required fields
    if (!admin_id || !action_type) {
      return NextResponse.json(
        { error: 'Missing required fields: admin_id, action_type' },
        { status: 400 }
      );
    }

    const supabase = getSupabase();

    // Get IP and User-Agent from request headers
    const headers = request.headers;
    const ip_address = headers.get('x-forwarded-for') || 
                       headers.get('x-real-ip') || 
                       'unknown';
    const user_agent = headers.get('user-agent') || 'unknown';

    // Call the database function to log action
    const { data: logId, error } = await supabase.rpc('log_admin_action', {
      p_admin_id: admin_id,
      p_action_type: action_type,
      p_resource_type: resource_type,
      p_resource_id: resource_id,
      p_old_values: old_values,
      p_new_values: new_values,
      p_reason: reason,
      p_ip_address: ip_address,
      p_user_agent: user_agent,
      p_workflow_id: workflow_id
    });

    if (error) {
      console.error('Failed to log admin action:', error);
      return NextResponse.json(
        { error: 'Failed to log action', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      logId,
      executionTimeMs: Date.now() - startTime
    });

  } catch (error: any) {
    console.error('[Admin Log Action] Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error.message,
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * GET: Fetch admin logs with filters
 */
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  const adminId = searchParams.get('adminId');
  const actionType = searchParams.get('actionType');
  const resourceType = searchParams.get('resourceType');
  const limit = parseInt(searchParams.get('limit') || '50');
  const offset = parseInt(searchParams.get('offset') || '0');

  try {
    const supabase = getSupabase();

    let query = supabase
      .from('admin_activity_logs')
      .select('*', { count: 'exact' });

    if (adminId) {
      query = query.eq('admin_id', adminId);
    }
    if (actionType) {
      query = query.eq('action_type', actionType);
    }
    if (resourceType) {
      query = query.eq('resource_type', resourceType);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);

    if (error) {
      return NextResponse.json(
        { error: 'Failed to fetch logs', details: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({
      logs: data || [],
      count: count || 0,
      limit,
      offset
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
