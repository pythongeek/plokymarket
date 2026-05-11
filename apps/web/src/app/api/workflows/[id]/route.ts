/**
 * Individual Workflow Operations API
 * GET - Retrieve workflow, PUT - Update workflow, DELETE - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { jwtVerify } from 'jose';
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/WorkflowBuilder';

/**
 * GET /api/workflows/[id]
 * Get specific workflow with execution history
 */
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


export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params;
    const supabase = createPublicClient();
    const url = new URL(request.url);
    const historyLimit = parseInt(url.searchParams.get('historyLimit') || '20');

    // Authenticate
    const user = await getUserFromRequest(request);

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: profile, error: userError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Check if it's a default workflow
    const defaultKey = workflowId.replace('default_', '');
    if (workflowId.startsWith('default_') && defaultKey in DEFAULT_WORKFLOWS) {
      const defaultWorkflow = DEFAULT_WORKFLOWS[defaultKey as keyof typeof DEFAULT_WORKFLOWS];
      return NextResponse.json({
        success: true,
        workflow: {
          id: workflowId,
          name: defaultWorkflow.name,
          description: defaultWorkflow.description,
          event_category: defaultWorkflow.eventCategory,
          config: { steps: defaultWorkflow.steps },
          enabled: true,
          is_default: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          executions: [],
        },
      });
    }

    // Get custom workflow
    const { data: workflow, error: workflowError } = await supabase
      .from('verification_workflows')
      .select('*')
      .eq('id', workflowId)
      .single();

    if (workflowError) {
      return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
    }

    // Get execution history
    const { data: executions, error: execError } = await supabase
      .from('workflow_executions')
      .select('*')
      .eq('workflow_id', workflowId)
      .order('created_at', { ascending: false })
      .limit(historyLimit);

    if (execError) {
      console.error('Execution history error:', execError);
    }

    return NextResponse.json({
      success: true,
      workflow: {
        ...workflow,
        executions: executions || [],
      },
    });
  } catch (error: any) {
    console.error('GET /api/workflows/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve workflow' },
      { status: 500 }
    );
  }
}

/**
 * PUT /api/workflows/[id]
 * Update workflow configuration
 */
export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params;
    const body = await request.json();
    const supabase = createPublicClient();

    // Authenticate
    const user = await getUserFromRequest(request);

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: profile, error: userError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Prevent updating default workflows
    if (workflowId.startsWith('default_')) {
      return NextResponse.json(
        { error: 'Cannot modify default workflows' },
        { status: 400 }
      );
    }

    // Build update object
    const updates: Record<string, any> = {
      updated_at: new Date().toISOString(),
      updated_by: user.id,
    };

    if (body.name) updates.name = body.name;
    if (body.description !== undefined) updates.description = body.description;
    if (body.enabled !== undefined) updates.enabled = body.enabled;
    if (body.config) updates.config = body.config;

    // Update in database
    const { data: workflow, error } = await supabase
      .from('verification_workflows')
      .update(updates)
      .eq('id', workflowId)
      .select()
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      throw error;
    }

    return NextResponse.json({
      success: true,
      message: 'Workflow updated successfully',
      workflow,
    });
  } catch (error: any) {
    console.error('PUT /api/workflows/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to update workflow' },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/workflows/[id]
 * Delete custom workflow (prevents deletion of defaults)
 */
export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params;
    const supabase = createPublicClient();

    // Authenticate
    const user = await getUserFromRequest(request);

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: profile, error: userError } = await supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single();

    if (userError || !profile?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Prevent deletion of default workflows
    if (workflowId.startsWith('default_')) {
      return NextResponse.json(
        { error: 'Cannot delete default workflows' },
        { status: 400 }
      );
    }

    // Delete from database
    const { error } = await supabase
      .from('verification_workflows')
      .delete()
      .eq('id', workflowId);

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json({ error: 'Workflow not found' }, { status: 404 });
      }
      throw error;
    }

    // Delete execution history
    await supabase.from('workflow_executions').delete().eq('workflow_id', workflowId);

    return NextResponse.json({
      success: true,
      message: 'Workflow deleted successfully',
    });
  } catch (error: any) {
    console.error('DELETE /api/workflows/[id] error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to delete workflow' },
      { status: 500 }
    );
  }
}
