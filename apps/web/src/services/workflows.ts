/**
 * Workflow Service
 * Handles workflow execution, scheduling, and analytics
 */

import { getBrowserClient } from '@/lib/supabase/client';
import type {
  VerificationWorkflow,
  WorkflowExecution,
  WorkflowAnalyticsDaily,
  DbResult,
  DbListResult,
  RealtimePayload,
  WorkflowSchedule,
  WorkflowStats,
} from '@/types/database';

const supabase = getBrowserClient();

// ===================================
// WORKFLOW CRUD OPERATIONS
// ===================================

export async function fetchWorkflows(options: {
  isActive?: boolean;
  category?: string;
  limit?: number;
} = {}): Promise<DbListResult<VerificationWorkflow>> {
  let query = supabase
    .from('verification_workflows')
    .select('*', { count: 'exact' });

  if (options.isActive !== undefined) {
    query = query.eq('is_active', options.isActive);
  }

  if (options.category) {
    query = query.eq('event_category', options.category);
  }

  query = query.order('created_at', { ascending: false });

  if (options.limit) {
    query = query.limit(options.limit);
  }

  const { data, error, count } = await query;

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchWorkflowById(id: string): Promise<DbResult<VerificationWorkflow>> {
  const { data, error } = await supabase
    .from('verification_workflows')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function createWorkflow(
  workflowData: Partial<VerificationWorkflow>
): Promise<DbResult<VerificationWorkflow>> {
  const { data, error } = await supabase
    .from('verification_workflows')
    .insert(workflowData)
    .select()
    .single();

  return { data, error };
}

export async function updateWorkflow(
  id: string,
  updates: Partial<VerificationWorkflow>
): Promise<DbResult<VerificationWorkflow>> {
  const { data, error } = await supabase
    .from('verification_workflows')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single();

  return { data, error };
}

export async function deleteWorkflow(id: string): Promise<DbResult<null>> {
  const { error } = await supabase
    .from('verification_workflows')
    .delete()
    .eq('id', id);

  return { data: null, error };
}

// ===================================
// WORKFLOW EXECUTION OPERATIONS
// ===================================

export async function fetchWorkflowExecutions(options: {
  workflowId?: string;
  eventId?: string;
  status?: string;
  limit?: number;
  offset?: number;
} = {}): Promise<DbListResult<WorkflowExecution>> {
  let query = supabase
    .from('workflow_executions')
    .select('*', { count: 'exact' });

  if (options.workflowId) {
    query = query.eq('workflow_id', options.workflowId);
  }

  if (options.eventId) {
    query = query.eq('event_id', options.eventId);
  }

  if (options.status) {
    query = query.eq('status', options.status);
  }

  query = query
    .order('created_at', { ascending: false })
    .limit(options.limit || 50)
    .range(options.offset || 0, (options.offset || 0) + (options.limit || 50) - 1);

  const { data, error, count } = await query;

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchWorkflowExecutionById(id: string): Promise<DbResult<WorkflowExecution>> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .select('*')
    .eq('id', id)
    .single();

  return { data, error };
}

export async function fetchPendingExecutions(): Promise<DbListResult<WorkflowExecution>> {
  const { data, error, count } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact' })
    .eq('status', 'pending')
    .order('scheduled_for', { ascending: true });

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchRunningExecutions(): Promise<DbListResult<WorkflowExecution>> {
  const { data, error, count } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact' })
    .eq('status', 'running')
    .order('started_at', { ascending: false });

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchFailedExecutions(limit: number = 50): Promise<DbListResult<WorkflowExecution>> {
  const { data, error, count } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact' })
    .eq('status', 'failed')
    .order('created_at', { ascending: false })
    .limit(limit);

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchEscalatedExecutions(): Promise<DbListResult<WorkflowExecution>> {
  const { data, error, count } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact' })
    .eq('status', 'escalated')
    .order('escalated_at', { ascending: false });

  return {
    data: data || [],
    error,
    count,
  };
}

// ===================================
// WORKFLOW ANALYTICS
// ===================================

export async function fetchWorkflowAnalytics(
  workflowId?: string,
  startDate?: string,
  endDate?: string
): Promise<DbListResult<WorkflowAnalyticsDaily>> {
  let query = supabase
    .from('workflow_analytics_daily')
    .select('*', { count: 'exact' });

  if (workflowId) {
    query = query.eq('workflow_id', workflowId);
  }

  if (startDate) {
    query = query.gte('date', startDate);
  }

  if (endDate) {
    query = query.lte('date', endDate);
  }

  query = query.order('date', { ascending: false });

  const { data, error, count } = await query;

  return {
    data: data || [],
    error,
    count,
  };
}

export async function fetchWorkflowStats(): Promise<DbResult<WorkflowStats>> {
  // Get total executions
  const { count: totalExecutions, error: totalError } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true });

  if (totalError) return { data: null, error: totalError };

  // Get successful executions
  const { count: successfulExecutions, error: successError } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  if (successError) return { data: null, error: successError };

  // Get failed executions
  const { count: failedExecutions, error: failedError } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'failed');

  if (failedError) return { data: null, error: failedError };

  // Get last 24 hours stats
  const last24Hours = new Date();
  last24Hours.setHours(last24Hours.getHours() - 24);

  const { count: last24hExecutions, error: last24hError } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .gte('created_at', last24Hours.toISOString());

  if (last24hError) return { data: null, error: last24hError };

  const { count: last24hSuccessful, error: last24hSuccessError } = await supabase
    .from('workflow_executions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed')
    .gte('created_at', last24Hours.toISOString());

  if (last24hSuccessError) return { data: null, error: last24hSuccessError };

  const stats: WorkflowStats = {
    totalExecutions: totalExecutions || 0,
    successfulExecutions: successfulExecutions || 0,
    failedExecutions: failedExecutions || 0,
    averageExecutionTime: 0, // Would need to calculate from data
    last24Hours: {
      executions: last24hExecutions || 0,
      successRate: last24hExecutions ? ((last24hSuccessful || 0) / last24hExecutions) * 100 : 0,
    },
  };

  return { data: stats, error: null };
}

// ===================================
// QSTASH SCHEDULE OPERATIONS
// ===================================

export async function fetchQStashSchedules(): Promise<WorkflowSchedule[]> {
  try {
    const response = await fetch('/api/admin/qstash/setup');
    if (!response.ok) throw new Error('Failed to fetch schedules');
    const data = await response.json();
    return data.schedules || [];
  } catch (error) {
    console.error('Error fetching QStash schedules:', error);
    return [];
  }
}

export async function createQStashSchedule(schedule: {
  name: string;
  description: string;
  cron: string;
  endpoint: string;
}): Promise<boolean> {
  try {
    const response = await fetch('/api/admin/qstash/setup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(schedule),
    });
    return response.ok;
  } catch (error) {
    console.error('Error creating QStash schedule:', error);
    return false;
  }
}

export async function deleteQStashSchedule(scheduleId: string): Promise<boolean> {
  try {
    const response = await fetch(`/api/admin/qstash/setup?id=${scheduleId}`, {
      method: 'DELETE',
    });
    return response.ok;
  } catch (error) {
    console.error('Error deleting QStash schedule:', error);
    return false;
  }
}

// ===================================
// WORKFLOW TRIGGER OPERATIONS
// ===================================

export async function triggerWorkflowExecution(
  workflowId: string,
  eventId: string
): Promise<DbResult<WorkflowExecution>> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .insert({
      workflow_id: workflowId,
      event_id: eventId,
      status: 'pending',
      stage: 'initialization',
      retry_count: 0,
      max_retries: 3,
      notified: false,
    })
    .select()
    .single();

  return { data, error };
}

export async function retryWorkflowExecution(
  executionId: string
): Promise<DbResult<WorkflowExecution>> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .update({
      status: 'pending',
      error_message: null,
      retry_count: supabase.rpc('increment_retry', { execution_id: executionId }),
    })
    .eq('id', executionId)
    .select()
    .single();

  return { data, error };
}

export async function escalateWorkflowExecution(
  executionId: string,
  reason: string,
  escalatedTo: string
): Promise<DbResult<WorkflowExecution>> {
  const { data, error } = await supabase
    .from('workflow_executions')
    .update({
      status: 'escalated',
      escalation_reason: reason,
      escalated_to: escalatedTo,
      escalated_at: new Date().toISOString(),
    })
    .eq('id', executionId)
    .select()
    .single();

  return { data, error };
}

// ===================================
// REAL-TIME SUBSCRIPTIONS
// ===================================

export function subscribeToWorkflowExecutions(
  callback: (payload: RealtimePayload<WorkflowExecution>) => void
) {
  const channel = supabase
    .channel('workflow-executions')
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'workflow_executions',
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

export function subscribeToWorkflow(
  workflowId: string,
  callback: (payload: RealtimePayload<VerificationWorkflow>) => void
) {
  const channel = supabase
    .channel(`workflow-${workflowId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'verification_workflows',
        filter: `id=eq.${workflowId}`,
      },
      callback
    )
    .subscribe();

  return () => {
    channel.unsubscribe();
  };
}

// ===================================
// BULK OPERATIONS
// ===================================

export async function bulkUpdateWorkflowStatus(
  workflowIds: string[],
  isActive: boolean
): Promise<boolean> {
  const { error } = await supabase
    .from('verification_workflows')
    .update({ is_active: isActive })
    .in('id', workflowIds);

  return !error;
}

export async function bulkDeleteWorkflows(workflowIds: string[]): Promise<boolean> {
  const { error } = await supabase
    .from('verification_workflows')
    .delete()
    .in('id', workflowIds);

  return !error;
}