/**
 * Admin Workflow - Upstash Workflow Integration
 * Handles long-running admin operations with audit logging
 * Example: Market resolution with dispute period
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
    const payload = await request.json();
    const { step, data } = payload;
    
    const supabase = getSupabase();

    // Step 1: Initiate admin action with logging
    if (step === 'initiate' || !step) {
      const { 
        adminId, 
        actionType, 
        resourceType, 
        resourceId, 
        newValues,
        reason,
        delayHours = 0 
      } = data;

      // Log the action initiation
      const { data: logId, error: logError } = await supabase.rpc('log_admin_action', {
        p_admin_id: adminId,
        p_action_type: actionType,
        p_resource_type: resourceType,
        p_resource_id: resourceId,
        p_new_values: newValues,
        p_reason: reason,
        p_workflow_id: `wf-${Date.now()}`
      });

      if (logError) {
        throw new Error(`Failed to log action: ${logError.message}`);
      }

      // If no delay, complete immediately
      if (delayHours === 0) {
        // Execute action immediately
        await executeAdminAction(actionType, resourceId, newValues);
        
        // Update log as completed
        await supabase.rpc('update_admin_log_workflow', {
          p_log_id: logId,
          p_workflow_status: 'completed'
        });

        return NextResponse.json({
          step: 'initiate',
          status: 'completed',
          logId,
          message: 'Action executed immediately',
          executionTimeMs: Date.now() - startTime
        });
      }

      // Return with delay instruction
      return NextResponse.json({
        step: 'initiate',
        status: 'pending',
        logId,
        workflowId: `wf-${Date.now()}`,
        nextStep: 'wait-and-validate',
        delayHours,
        executionTimeMs: Date.now() - startTime
      });
    }

    // Step 2: Wait period with validation
    if (step === 'wait-and-validate') {
      const { logId, resourceId, actionType, newValues, adminId } = data;

      // Check for disputes or issues
      const { data: disputes } = await supabase
        .from('dispute_records')
        .select('id')
        .eq('market_id', resourceId)
        .in('status', ['pending', 'under_review']);

      if (disputes && disputes.length > 0) {
        // Disputes found - escalate to manual review
        await supabase.rpc('update_admin_log_workflow', {
          p_log_id: logId,
          p_workflow_status: 'failed'
        });

        return NextResponse.json({
          step: 'wait-and-validate',
          status: 'escalated',
          logId,
          reason: 'Active disputes found',
          disputeCount: disputes.length,
          executionTimeMs: Date.now() - startTime
        });
      }

      return NextResponse.json({
        step: 'wait-and-validate',
        status: 'validated',
        logId,
        nextStep: 'execute',
        executionTimeMs: Date.now() - startTime
      });
    }

    // Step 3: Execute the admin action
    if (step === 'execute') {
      const { logId, actionType, resourceId, newValues, adminId } = data;

      // Execute the action
      const result = await executeAdminAction(actionType, resourceId, newValues);

      // Update log as completed
      await supabase.rpc('update_admin_log_workflow', {
        p_log_id: logId,
        p_workflow_status: 'completed',
        p_new_values: result
      });

      return NextResponse.json({
        step: 'execute',
        status: 'completed',
        logId,
        result,
        executionTimeMs: Date.now() - startTime
      });
    }

    return NextResponse.json(
      { error: 'Unknown workflow step', step },
      { status: 400 }
    );

  } catch (error: any) {
    console.error('[Admin Workflow] Error:', error);
    return NextResponse.json(
      {
        error: 'Workflow failed',
        details: error.message,
        executionTimeMs: Date.now() - startTime
      },
      { status: 500 }
    );
  }
}

/**
 * Execute admin action based on type
 */
async function executeAdminAction(
  actionType: string,
  resourceId: string,
  newValues: any
): Promise<any> {
  const supabase = getSupabase();

  switch (actionType) {
    case 'resolve_event':
      // Resolve market
      const { data: market, error } = await supabase
        .from('markets')
        .update({
          status: 'resolved',
          outcome: newValues.outcome,
          resolved_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId)
        .select()
        .single();

      if (error) throw error;

      // Trigger settlement
      await supabase.rpc('settle_market_v2', {
        p_market_id: resourceId,
        p_winning_outcome: newValues.outcome === 1 ? 'YES' : 'NO'
      });

      return market;

    case 'pause_market':
      const { data: paused } = await supabase
        .from('markets')
        .update({
          status: 'paused',
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId)
        .select()
        .single();
      return paused;

    case 'resume_market':
      const { data: resumed } = await supabase
        .from('markets')
        .update({
          status: 'active',
          updated_at: new Date().toISOString()
        })
        .eq('id', resourceId)
        .select()
        .single();
      return resumed;

    default:
      throw new Error(`Unknown action type: ${actionType}`);
  }
}

/**
 * GET: Workflow status
 */
export async function GET(request: NextRequest) {
  return NextResponse.json({
    status: 'active',
    service: 'admin-workflow',
    steps: ['initiate', 'wait-and-validate', 'execute'],
    timestamp: new Date().toISOString()
  });
}
