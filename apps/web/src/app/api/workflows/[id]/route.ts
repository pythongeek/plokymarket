/**
 * Individual Workflow Operations API
 * GET - Retrieve workflow, PUT - Update workflow, DELETE - Delete workflow
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/WorkflowBuilder';

/**
 * GET /api/workflows/[id]
 * Get specific workflow with execution history
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const { id: workflowId } = await params;
    const supabase = await createClient();
    const url = new URL(request.url);
    const historyLimit = parseInt(url.searchParams.get('historyLimit') || '20');

    // Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (userError || !user?.is_admin) {
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
    const supabase = await createClient();

    // Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (userError || !user?.is_admin) {
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
      updated_by: session.user.id,
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
    const supabase = await createClient();

    // Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('is_admin')
      .eq('id', session.user.id)
      .single();

    if (userError || !user?.is_admin) {
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
