/**
 * Admin Activity Logger
 * Helper functions for logging admin actions
 * Works with Upstash Workflow for async operations
 */

import { supabase } from '@/lib/supabase';

interface LogAdminActionParams {
  admin_id: string;
  action_type: 
    | 'create_event' 
    | 'update_event' 
    | 'delete_event' 
    | 'resolve_event'
    | 'approve_topic' 
    | 'reject_topic' 
    | 'pause_market' 
    | 'resume_market'
    | 'add_expert' 
    | 'remove_expert' 
    | 'resolve_dispute' 
    | 'manual_override'
    | 'update_oracle' 
    | 'emergency_action'
    | 'verify_expert'
    | 'create_dispute';
  resource_type?: string;
  resource_id?: string;
  old_values?: Record<string, any>;
  new_values?: Record<string, any>;
  reason?: string;
  ip_address?: string;
  user_agent?: string;
  workflow_id?: string;
}

/**
 * Log admin action to database
 * Use this for synchronous logging (immediate actions)
 */
export async function logAdminAction({
  admin_id,
  action_type,
  resource_type,
  resource_id,
  old_values = {},
  new_values = {},
  reason = '',
  ip_address,
  user_agent,
  workflow_id
}: LogAdminActionParams): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    // Get client info if not provided (server-side)
    if (!ip_address || !user_agent) {
      // In server context, these would come from request headers
      // For client-side, we can use window.navigator
      if (typeof window !== 'undefined') {
        user_agent = user_agent || window.navigator.userAgent;
        // IP address can't be detected client-side, will be null
      }
    }

    const { data, error } = await supabase
      .from('admin_activity_logs')
      .insert({
        admin_id,
        action_type,
        resource_type,
        resource_id,
        old_values,
        new_values,
        reason,
        ip_address,
        user_agent,
        workflow_id,
        workflow_status: workflow_id ? 'pending' : 'completed'
      })
      .select('id')
      .single();

    if (error) {
      console.error('Failed to log admin action:', error);
      return { success: false, error: error.message };
    }

    return { success: true, logId: data.id };
  } catch (error: any) {
    console.error('Exception logging admin action:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Log admin action via Edge Function (for server-side with IP tracking)
 * Use this for better security and IP tracking
 */
export async function logAdminActionServer(params: LogAdminActionParams & {
  request?: Request;
}): Promise<{ success: boolean; logId?: string; error?: string }> {
  try {
    // Extract IP and User-Agent from request if provided
    let ip_address = params.ip_address;
    let user_agent = params.user_agent;

    if (params.request) {
      const headers = params.request.headers;
      ip_address = headers.get('x-forwarded-for') || 
                   headers.get('x-real-ip') || 
                   'unknown';
      user_agent = headers.get('user-agent') || 'unknown';
    }

    // Call Edge Function for secure logging
    const response = await fetch('/api/admin/log-action', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ...params,
        ip_address,
        user_agent
      })
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(error);
    }

    const result = await response.json();
    return { success: true, logId: result.logId };
  } catch (error: any) {
    console.error('Server logging failed:', error);
    // Fallback to client-side logging
    return logAdminAction(params);
  }
}

/**
 * Update workflow status for async operations
 * Call this when Upstash Workflow completes
 */
export async function updateAdminLogWorkflow(
  logId: string,
  workflowStatus: 'completed' | 'failed',
  newValues?: Record<string, any>
): Promise<boolean> {
  try {
    const { error } = await supabase
      .rpc('update_admin_log_workflow', {
        p_log_id: logId,
        p_workflow_status: workflowStatus,
        p_new_values: newValues
      });

    if (error) {
      console.error('Failed to update workflow status:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Exception updating workflow status:', error);
    return false;
  }
}

/**
 * Get admin activity summary
 */
export async function getAdminActivitySummary(
  adminId?: string,
  days: number = 7
): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .rpc('get_admin_activity_summary', {
        p_admin_id: adminId,
        p_start_date: new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString(),
        p_end_date: new Date().toISOString()
      });

    if (error) {
      console.error('Failed to get activity summary:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Exception getting activity summary:', error);
    return [];
  }
}

/**
 * Fetch admin logs with pagination
 */
export async function fetchAdminLogs(
  options: {
    adminId?: string;
    actionType?: string;
    resourceType?: string;
    limit?: number;
    offset?: number;
  } = {}
): Promise<{ logs: any[]; count: number }> {
  const { adminId, actionType, resourceType, limit = 50, offset = 0 } = options;

  try {
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
      console.error('Failed to fetch admin logs:', error);
      return { logs: [], count: 0 };
    }

    return { logs: data || [], count: count || 0 };
  } catch (error) {
    console.error('Exception fetching admin logs:', error);
    return { logs: [], count: 0 };
  }
}

/**
 * Hook for React components to log admin actions
 */
export function useAdminLogger() {
  const log = async (params: Omit<LogAdminActionParams, 'admin_id'>) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      console.error('No authenticated user for logging');
      return { success: false, error: 'Not authenticated' };
    }

    return logAdminAction({ ...params, admin_id: user.id });
  };

  return { log };
}
