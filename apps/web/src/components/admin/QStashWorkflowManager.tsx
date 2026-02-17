/**
 * Admin Component: QStash Workflow Manager
 * Manage background cron jobs from the admin panel
 */

'use client';

import { useQStashWorkflows } from '@/hooks/useQStashWorkflows';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Loader2, RefreshCw, Play, Trash2, Clock } from 'lucide-react';
import { toast } from 'sonner';

export function QStashWorkflowManager() {
  const { schedules, workflows, loading, error, createWorkflow, deleteWorkflow, refresh } = useQStashWorkflows();

  const handleCreate = async (workflowKey: string) => {
    try {
      await createWorkflow(workflowKey);
      toast.success(`Workflow ${workflowKey} created successfully`);
    } catch (err: any) {
      toast.error(`Failed to create workflow: ${err.message}`);
    }
  };

  const handleDelete = async (scheduleId: string) => {
    try {
      await deleteWorkflow(scheduleId);
      toast.success('Workflow deleted successfully');
    } catch (err: any) {
      toast.error(`Failed to delete workflow: ${err.message}`);
    }
  };

  // Check which workflows are active
  const activeWorkflows = new Set(schedules.map(s => s.destination.split('/api/').pop()?.replace('/', '-')));

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">QStash Workflow Management</h2>
        <Button variant="outline" onClick={refresh} disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Available Workflows */}
      <Card>
        <CardHeader>
          <CardTitle>Available Workflows</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4">
            {Object.entries(workflows).map(([key, config]) => {
              const isActive = schedules.some(s => s.destination.includes(config.path));
              
              return (
                <div key={key} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium capitalize">{key.replace('-', ' ')}</span>
                      {isActive ? (
                        <Badge className="bg-green-100 text-green-800 hover:bg-green-200">Active</Badge>
                      ) : (
                        <Badge variant="secondary">Not Deployed</Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">{config.description}</p>
                    <div className="flex items-center gap-4 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {config.cron}
                      </span>
                      <span>{config.method}</span>
                    </div>
                  </div>
                  
                  {!isActive ? (
                    <Button 
                      size="sm" 
                      onClick={() => handleCreate(key)}
                      disabled={loading}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Deploy
                    </Button>
                  ) : (
                    <Button 
                      size="sm" 
                      variant="destructive"
                      onClick={() => {
                        const schedule = schedules.find(s => s.destination.includes(config.path));
                        if (schedule) handleDelete(schedule.scheduleId);
                      }}
                      disabled={loading}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Remove
                    </Button>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Active Schedules */}
      <Card>
        <CardHeader>
          <CardTitle>Active Schedules ({schedules.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {schedules.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No active schedules</p>
          ) : (
            <div className="space-y-2">
              {schedules.map((schedule) => (
                <div key={schedule.scheduleId} className="flex items-center justify-between p-3 bg-gray-50 rounded text-sm">
                  <div className="space-y-1">
                    <div className="font-mono text-xs text-gray-600">{schedule.scheduleId}</div>
                    <div className="text-gray-800">{schedule.destination}</div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span>Cron: {schedule.cron}</span>
                      {schedule.isPaused && <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>}
                    </div>
                  </div>
                  <Button 
                    size="sm" 
                    variant="ghost"
                    onClick={() => handleDelete(schedule.scheduleId)}
                    disabled={loading}
                  >
                    <Trash2 className="h-4 w-4 text-red-500" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

export default QStashWorkflowManager;
