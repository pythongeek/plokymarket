/**
 * React Hook for Managing QStash Workflows
 * Used in Admin Panel to view and manage background cron jobs
 */

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';

interface WorkflowConfig {
  path: string;
  cron: string;
  method: string;
  description: string;
}

interface QStashSchedule {
  scheduleId: string;
  cron: string;
  destination: string;
  createdAt: number;
  isPaused?: boolean;
  lastScheduleTime?: number;
  nextScheduleTime?: number;
}

interface UseQStashWorkflowsReturn {
  schedules: QStashSchedule[];
  workflows: Record<string, WorkflowConfig>;
  loading: boolean;
  error: string | null;
  createWorkflow: (workflow: string) => Promise<void>;
  deleteWorkflow: (scheduleId: string) => Promise<void>;
  refresh: () => Promise<void>;
}

export function useQStashWorkflows(): UseQStashWorkflowsReturn {
  const [schedules, setSchedules] = useState<QStashSchedule[]>([]);
  const [workflows, setWorkflows] = useState<Record<string, WorkflowConfig>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const supabase = createClient();

  const fetchWorkflows = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/qstash/setup', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to fetch workflows');
      }

      const data = await response.json();
      setSchedules(data.schedules || []);
      setWorkflows(data.availableWorkflows || {});
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const createWorkflow = useCallback(async (workflow: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch('/api/admin/qstash/setup', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ workflow }),
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to create workflow');
      }

      await fetchWorkflows();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflows, supabase]);

  const deleteWorkflow = useCallback(async (scheduleId: string) => {
    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      const response = await fetch(`/api/admin/qstash/setup?scheduleId=${scheduleId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      });

      if (!response.ok) {
        const err = await response.json();
        throw new Error(err.error || 'Failed to delete workflow');
      }

      await fetchWorkflows();
    } catch (err: any) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchWorkflows, supabase]);

  useEffect(() => {
    fetchWorkflows();
  }, [fetchWorkflows]);

  return {
    schedules,
    workflows,
    loading,
    error,
    createWorkflow,
    deleteWorkflow,
    refresh: fetchWorkflows,
  };
}

export default useQStashWorkflows;
