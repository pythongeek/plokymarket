/**
 * Admin API for AI Topic Configurations
 * Manage news sources, prompts, and generation settings
 */

import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'edge';

// Verify admin authentication
async function verifyAdmin(request: Request): Promise<{ isAdmin: boolean; userId?: string; error?: string }> {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader?.startsWith('Bearer ')) {
    return { isAdmin: false, error: 'Missing authorization header' };
  }

  const token = authHeader.split(' ')[1];
  
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { data: { user }, error } = await supabase.auth.getUser(token);
  
  if (error || !user) {
    return { isAdmin: false, error: 'Invalid token' };
  }

  const { data: profile } = await supabase
    .from('users')
    .select('role')
    .eq('id', user.id)
    .single();

  if (profile?.role !== 'admin') {
    return { isAdmin: false, error: 'Not an admin' };
  }

  return { isAdmin: true, userId: user.id };
}

/**
 * GET /api/admin/ai-topic-configs
 * List all configurations
 */
export async function GET(request: Request) {
  const adminCheck = await verifyAdmin(request);
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const contextType = searchParams.get('context_type');
    const isActive = searchParams.get('is_active');

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    let query = supabase
      .from('ai_topic_configs')
      .select('*')
      .order('created_at', { ascending: false });

    if (contextType) {
      query = query.eq('context_type', contextType);
    }

    if (isActive !== null) {
      query = query.eq('is_active', isActive === 'true');
    }

    const { data, error } = await query;

    if (error) throw error;

    return NextResponse.json({
      success: true,
      configs: data || []
    });

  } catch (error: any) {
    console.error('[AI Topic Configs] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * POST /api/admin/ai-topic-configs
 * Create or update configuration
 */
export async function POST(request: Request) {
  const adminCheck = await verifyAdmin(request);
  
  if (!adminCheck.isAdmin || !adminCheck.userId) {
    return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { id, ...configData } = body;

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    let result;

    if (id) {
      // Update existing
      const { data, error } = await supabase
        .from('ai_topic_configs')
        .update({ ...configData, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      result = data;
    } else {
      // Create new
      const { data, error } = await supabase
        .from('ai_topic_configs')
        .insert({ ...configData, created_by: adminCheck.userId })
        .select()
        .single();

      if (error) throw error;
      result = data;
    }

    return NextResponse.json({
      success: true,
      config: result
    });

  } catch (error: any) {
    console.error('[AI Topic Configs] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/ai-topic-configs
 * Delete a configuration
 */
export async function DELETE(request: Request) {
  const adminCheck = await verifyAdmin(request);
  
  if (!adminCheck.isAdmin) {
    return NextResponse.json({ error: adminCheck.error || 'Unauthorized' }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Missing config ID' }, { status: 400 });
    }

    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );

    const { error } = await supabase
      .from('ai_topic_configs')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({
      success: true,
      message: 'Configuration deleted'
    });

  } catch (error: any) {
    console.error('[AI Topic Configs] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
