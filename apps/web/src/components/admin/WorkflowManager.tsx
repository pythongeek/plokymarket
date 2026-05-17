'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  Loader2, Play, Clock, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Zap
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';

// API helper
async function adminFetch(path: string, options?: RequestInit) {
  const res = await fetch(path, {
    ...options,
    headers: { 'Content-Type': 'application/json', ...options?.headers },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: 'Request failed' }));
    throw new Error(err.error || 'API error');
  }
  return res.json();
}

interface CronJob {
  jobId: number;
  title: string;
  url: string;
  schedule: {
    timezone: string;
    hours: number[];
    mdays: number[];
    minutes: number[];
    months: number[];
    wdays: number[];
  };
  enabled: boolean;
  lastStatus?: number;
  lastExecution?: string;
  nextExecution?: string;
}

function formatSchedule(schedule: CronJob['schedule']): string {
  if (schedule.minutes.length === 1 && schedule.hours.length === 1) {
    return `Daily at ${String(schedule.hours[0]).padStart(2, '0')}:${String(schedule.minutes[0]).padStart(2, '0')}`;
  }
  if (schedule.minutes.length === 60) {
    return 'Every minute';
  }
  if (schedule.minutes.length === 1 && schedule.hours.length === 24) {
    return `Every hour at :${String(schedule.minutes[0]).padStart(2, '0')}`;
  }
  return `${schedule.minutes.length} min intervals`;
}

export default function WorkflowManager() {
  const { toast } = useToast();
  const [jobs, setJobs] = useState<CronJob[]>([]);
  const [loading, setLoading] = useState(true);
  const [triggeringId, setTriggeringId] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  const fetchJobs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await adminFetch('/api/admin/workflows/cron-job');
      setJobs(result.data || []);
    } catch (err: any) {
      setError(err.message);
      toast({ title: 'Failed to load jobs', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchJobs();
  }, [fetchJobs]);

  const handleTrigger = async (job: CronJob) => {
    setTriggeringId(job.jobId);
    try {
      await adminFetch('/api/admin/workflows/cron-job', {
        method: 'POST',
        body: JSON.stringify({ jobId: job.jobId }),
      });
      toast({ title: `${job.title} triggered`, description: 'Check cron-job.org for execution status' });
    } catch (err: any) {
      toast({ title: 'Trigger failed', description: err.message, variant: 'destructive' });
    } finally {
      setTriggeringId(null);
    }
  };

  if (loading) {
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
          <h2 className="text-2xl font-bold text-white">Cron Job Management</h2>
          <p className="text-slate-400">Manage cron-job.org schedules and trigger workflows manually</p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => fetchJobs()}
          disabled={loading}
          className="border-slate-700 text-slate-200 hover:bg-slate-800"
        >
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {error && (
        <div className="bg-red-900/30 border border-red-700 text-red-200 px-4 py-3 rounded">
          Error: {error}
        </div>
      )}

      {/* Jobs Table */}
      <Card className="bg-slate-900/80 border-slate-700/50">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Zap className="w-5 h-5 text-yellow-400" />
            Active Cron Jobs ({jobs.length})
          </CardTitle>
          <CardDescription className="text-slate-400">
            View schedules and trigger jobs manually via cron-job.org
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {jobs.map((job) => (
              <div
                key={job.jobId}
                className={`p-4 rounded-lg border ${job.enabled
                    ? 'bg-slate-800/50 border-slate-700'
                    : 'bg-slate-900/50 border-slate-800 opacity-60'
                  }`}
              >
                <div className="flex items-center justify-between gap-4">
                  {/* Job Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-white">{job.title}</h3>
                      <Badge variant={job.enabled ? 'default' : 'secondary'}>
                        {job.enabled ? 'Active' : 'Inactive'}
                      </Badge>
                      {job.lastStatus !== undefined && (
                        <Badge variant={job.lastStatus === 200 ? 'default' : 'destructive'}>
                          {job.lastStatus === 200 ? 'OK' : `HTTP ${job.lastStatus}`}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-slate-400 mt-1 truncate">{job.url}</p>
                  </div>

                  {/* Schedule */}
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-slate-300">
                      <Clock className="w-3 h-3 mr-1" />
                      {formatSchedule(job.schedule)}
                    </Badge>
                  </div>

                  {/* Trigger */}
                  <div className="flex items-center gap-3">
                    <Button
                      size="sm"
                      onClick={() => handleTrigger(job)}
                      disabled={triggeringId === job.jobId || !job.enabled}
                      className="bg-emerald-600 hover:bg-emerald-700"
                    >
                      {triggeringId === job.jobId ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Status Info */}
                <div className="mt-3 pt-3 border-t border-slate-700/50 flex items-center gap-6 text-sm text-slate-400">
                  {job.lastExecution && (
                    <span>Last run: {new Date(job.lastExecution).toLocaleString()}</span>
                  )}
                  {job.nextExecution && (
                    <span>Next: {new Date(job.nextExecution).toLocaleString()}</span>
                  )}
                </div>
              </div>
            ))}

            {jobs.length === 0 && !error && (
              <div className="text-center py-8 text-slate-400">
                <AlertCircle className="w-8 h-8 mx-auto mb-2" />
                <p>No cron jobs found</p>
                <p className="text-sm">Verify your cron-job.org API key is configured</p>
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
              <h4 className="font-medium text-blue-300">cron-job.org Integration</h4>
              <p className="text-sm text-blue-200/70 mt-1">
                Jobs are managed externally at cron-job.org. Use this panel to monitor status and trigger manual runs.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
