/**
 * Workflow Management API Routes
 * Handles CRUD operations, execution, and monitoring of verification workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/WorkflowBuilder';

/**
 * GET /api/workflows
 * List all workflows (default + custom)
 * Query params: category, enabled
 */
export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const enabled = url.searchParams.get('enabled');

    // Get authentication info
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: user, error: userError } = await (supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single() as any);

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Get custom workflows from database
    let query = supabase.from('verification_workflows').select('*');

    if (category) {
      query = query.eq('event_category', category);
    }

    if (enabled !== null) {
      query = query.eq('enabled', enabled === 'true');
    }

    const { data: customWorkflows, error } = await query.order('created_at', {
      ascending: false,
    });

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    // Combine default and custom workflows
    const workflowList = [
      ...Object.values(DEFAULT_WORKFLOWS).map((w) => ({
        id: `default_${w.eventCategory}`,
        name: w.name,
        description: w.description,
        event_category: w.eventCategory,
        config: { steps: w.steps },
        enabled: true,
        is_default: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })),
      ...(customWorkflows || []),
    ];

    // Apply filters if needed
    let filtered = workflowList;
    if (category) {
      filtered = filtered.filter((w) => w.event_category === category);
    }
    if (enabled !== null) {
      filtered = filtered.filter((w) => w.enabled === (enabled === 'true'));
    }

    return NextResponse.json({
      success: true,
      count: filtered.length,
      workflows: filtered,
    });
  } catch (error: any) {
    console.error('GET /api/workflows error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to load workflows' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/workflows
 * Create a new custom workflow
 */
export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const body = await request.json();

    // Authenticate
    const {
      data: { session },
    } = await supabase.auth.getSession();

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: user, error: userError } = await (supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', session.user.id)
      .single() as any);

    if (userError || !user?.is_admin) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 });
    }

    // Validate input
    if (!body.name || !body.eventCategory) {
      return NextResponse.json(
        { error: 'Missing required fields: name, eventCategory' },
        { status: 400 }
      );
    }

    // Create workflow in database
    const { data: workflow, error } = await (supabase
      .from('verification_workflows')
      .insert({
        name: body.name,
        description: body.description || '',
        event_category: body.eventCategory,
        config: {
          steps: body.steps || [
            {
              id: '1',
              name: 'Primary Verification',
              sources: body.sources || [],
              logic: body.logic || 'weighted_consensus',
              requiredConfidence: body.requiredConfidence || 80,
            },
          ],
          globalTimeout: body.globalTimeout || 300000,
          escalationThreshold: body.escalationThreshold || 75,
        },
        enabled: true,
        created_by: session.user.id,
      })
      .select()
      .single() as any);

    if (error) {
      console.error('Database error:', error);
      throw error;
    }

    return NextResponse.json(
      {
        success: true,
        message: 'Workflow created successfully',
        workflow,
      },
      { status: 201 }
    );
  } catch (error: any) {
    console.error('POST /api/workflows error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to create workflow' },
      { status: 500 }
    );
  }
}
