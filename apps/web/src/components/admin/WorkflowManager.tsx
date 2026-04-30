'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Input } from '@/components/ui/input';
import {
  Loader2, Play, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Save, Edit2, Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

interface WorkflowConfig {
  id: string;
  name: string;
  endpoint: string;
  cron_expression: string;
  is_active: boolean;
  last_run: string | null;
  next_run: string | null;
  last_status: string | null;
  execution_time_ms: number | null;
  created_at: string;
  updated_at: string;
}

export default function WorkflowManager() {
  const supabase = createClient();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editingCron, setEditingCron] = useState<string | null>(null);
  const [cronValues, setCronValues] = useState<Record<string, string>>({});

  // Fetch workflows from database
  const { data: workflows, isLoading, refetch } = useQuery({
    queryKey: ['workflowConfigs'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('workflow_configs')
        .select('*')
        .order('name');

      if (error) throw error;
      return data as WorkflowConfig[];
    }
  });

  // Toggle workflow active/inactive
  const toggleMutation = useMutation({
    mutationFn: async ({ id, isActive }: { id: string; isActive: boolean }) => {
      const { error } = await supabase
        .from('workflow_configs')
        .update({ is_active: isActive, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowConfigs'] });
      toast({ title: 'Workflow status updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update', description: error.message, variant: 'destructive' });
    }
  });

  // Update cron expression
  const updateCronMutation = useMutation({
    mutationFn: async ({ id, cron }: { id: string; cron: string }) => {
      const { error } = await supabase
        .from('workflow_configs')
        .update({ cron_expression: cron, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workflowConfigs'] });
      setEditingCron(null);
      toast({ title: 'Cron expression updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Failed to update cron', description: error.message, variant: 'destructive' });
    }
  });

  // Manual trigger workflow
  const triggerMutation = useMutation({
    mutationFn: async (workflow: WorkflowConfig) => {
      const response = await fetch(workflow.endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          // Add cron secret header for authentication
          'x-cron-secret': process.env.NEXT_PUBLIC_CRON_SECRET || 'ploky-cron-secret'
        }
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `HTTP ${response.status}`);
      }

      return response.json();
    },
    onSuccess: (data, workflow) => {
      toast({
        title: `${workflow.name} triggered successfully`,
        description: `Execution time: ${data.execution_time_ms || 'N/A'}ms`
      });
      refetch();
    },
    onError: (error: Error, workflow) => {
      toast({
        title: `Failed to trigger ${workflow.name}`,
        description: error.message,
        variant: 'destructive'
      });
    }
  });

  const formatCron = (cron: string) => {
    const descriptions: Record<string, string> = {
      '*/5 * * * *': 'Every 5 min',
      '*/15 * * * *': 'Every 15 min',
      '*/30 * * * *': 'Every 30 min',
      '0 * * * *': 'Every hour',
      '0 */2 * * *': 'Every 2 hours',
      '0 */4 * * *': 'Every 4 hours',
      '0 */6 * * *': 'Every 6 hours',
      '0 */12 * * *': 'Every 12 hours',
      '0 0 * * *': 'Daily at midnight',
      '0 1 * * *': 'Daily at 1 AM',
      '0 2 * * *': 'Daily at 2 AM',
    };
    return descriptions[cron] || cron;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return 'Never';
    return new Date(dateStr).toLocaleString('bn-BD');
  };

  const handleSaveCron = (workflow: WorkflowConfig) => {
    const newCron = cronValues[workflow.id];
    if (newCron && newCron !== workflow.cron_expression) {
      updateCronMutation.mutate({ id: workflow.id, cron: newCron });
    } else {
      setEditingCron(null);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-violet-500" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white">Workflow Configuration</h2>
          <p className="text-slate-400">Manage cron schedules and trigger workflows manually</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          className="border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Workflows Table */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Workflow Schedules ({workflows?.length || 0})
          </CardTitle>
          <CardDescription className="text-slate-400">
            Toggle workflows on/off, edit schedules, or trigger manually
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {workflows?.map((workflow) => (
              <div
                key={workflow.id}
                className={`p-4 rounded-lg border ${workflow.is_active
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                  }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Workflow Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{workflow.name}</h3>
                      <Badge variant={workflow.is_active ? 'default' : 'secondary'}>
                        {workflow.is_active ? 'Active' : 'Inactive'}
                      </Badge>
                      {workflow.last_status && (
                        <Badge variant={workflow.last_status === 'success' ? 'default' : 'destructive'}>
                          {workflow.last_status}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1">{workflow.endpoint}</p>
                  </div>

                  {/* Cron Schedule */}
                  <div className="flex items-center gap-2">
                    {editingCron === workflow.id ? (
                      <div className="flex items-center gap-2">
                        <Input
                          value={cronValues[workflow.id] || ''}
                          onChange={(e) => setCronValues({ ...cronValues, [workflow.id]: e.target.value })}
                          placeholder="*/5 * * * *"
                          className="w-32 bg-slate-800 border-slate-600 text-white"
                        />
                        <Button
                          size="sm"
                          onClick={() => handleSaveCron(workflow)}
                          disabled={updateCronMutation.isPending}
                        >
                          {updateCronMutation.isPending ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                          ) : (
                            <Save className="w-4 h-4" />
                          )}
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingCron(null)}
                        >
                          <XCircle className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Badge variant="outline" className="text-slate-300">
                          <Clock className="w-3 h-3 mr-1" />
                          {formatCron(workflow.cron_expression)}
                        </Badge>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditingCron(workflow.id);
                            setCronValues({ ...cronValues, [workflow.id]: workflow.cron_expression });
                          }}
                          className="text-slate-400 hover:text-white"
                        >
                          <Edit2 className="w-3 h-3" />
                        </Button>
                      </div>
                    )}
                  </div>

                  {/* Toggle & Trigger */}
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={workflow.is_active}
                      onCheckedChange={(checked) =>
                        toggleMutation.mutate({ id: workflow.id, isActive: checked })
                      }
                      disabled={toggleMutation.isPending}
                    />
                    <Button
                      size="sm"
                      onClick={() => triggerMutation.mutate(workflow)}
                      disabled={triggerMutation.isPending}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {triggerMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status Info */}
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-6 text-sm text-slate-400">
                  <span>Last run: {formatDate(workflow.last_run)}</span>
                  {workflow.execution_time_ms && (
                    <span>Last execution: {workflow.execution_time_ms}ms</span>
                  )}
                </div>
              </div>
            ))}

            {(!workflows || workflows.length === 0) && (
              <div className="text-center py-8 text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No workflows configured</p>
                <p className="text-sm">Run migration 200 to add default workflows</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Info Card */}
      <Card className="bg-blue-900/20 border-blue-700/50">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-blue-400 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-300">Cron Expression Guide</h4>
              <p className="text-sm text-blue-200/70 mt-1">
                Format: minute hour day-of-month month day-of-week
              </p>
              <div className="mt-2 text-sm text-blue-200/70 space-y-1">
                <p>• <code className="bg-blue-800/50 px-1 rounded">*/5 * * * *</code> - Every 5 minutes</p>
                <p>• <code className="bg-blue-800/50 px-1 rounded">0 */2 * * *</code> - Every 2 hours</p>
                <p>• <code className="bg-blue-800/50 px-1 rounded">0 2 * * *</code> - Daily at 2 AM</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
