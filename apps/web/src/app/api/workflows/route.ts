/**
 * Workflow Management API Routes
 * Handles CRUD operations, execution, and monitoring of verification workflows
 */

import { NextRequest, NextResponse } from 'next/server';
import { createPublicClient } from '@/lib/supabase/server';
import { DEFAULT_WORKFLOWS } from '@/lib/workflows/WorkflowBuilder';
import { jwtVerify } from 'jose';

/**
 * GET /api/workflows
 * List all workflows (default + custom)
 * Query params: category, enabled
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


export async function GET(request: NextRequest) {
  try {
    const supabase = createPublicClient();
    const url = new URL(request.url);
    const category = url.searchParams.get('category');
    const enabled = url.searchParams.get('enabled');

    // Get authentication info
    const user = await getUserFromRequest(request);

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check if user is admin
    const { data: profile, error: userError } = await (supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as any);

    if (userError || !profile?.is_admin) {
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
    const supabase = createPublicClient();
    const body = await request.json();

    // Authenticate
    const user = await getUserFromRequest(request);

    if (!profile) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Check admin
    const { data: profile, error: userError } = await (supabase
      .from('user_profiles')
      .select('is_admin')
      .eq('id', user.id)
      .single() as any);

    if (userError || !profile?.is_admin) {
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
        created_by: user.id,
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
