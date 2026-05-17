'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Activity, Server, AlertTriangle, CheckCircle, Clock, RefreshCw,
  TrendingUp, TrendingDown, Database, Zap, BarChart3, Play
} from 'lucide-react';
import { toast } from '@/components/ui/use-toast';

interface PulseData {
  status: {
    database: 'healthy' | 'degraded' | 'down';
    api: 'healthy' | 'degraded' | 'down';
    memory: 'healthy' | 'degraded' | 'down';
  };
  metrics: {
    dbLatencyMs: number;
    memoryUsedMB: number;
    memoryTotalMB: number;
    memoryRSSMB: number;
    uptimeSeconds: number;
    errorRate24h: number;
    totalErrors24h: number;
  };
  slowQueries: Array<{
    query: string;
    mean_exec_time: number;
    calls: number;
    rows: number;
  }>;
  recentErrors: Array<{
    id: string;
    level: string;
    source: string;
    message: string;
    route?: string;
    created_at: string;
  }>;
  timestamp: string;
}

interface CronJobInfo {
  name: string;
  url: string;
  status: 'Success' | 'Failed' | 'Pending';
  lastRun?: string;
}

const INITIAL_CRON_JOBS: CronJobInfo[] = [
  { name: "AI Topics", url: "/api/cron/daily-ai-topics", status: "Pending" },
  { name: "Batch Categories", url: "/api/cron/batch-categories", status: "Pending" },
  { name: "Dispute Workflow", url: "/api/dispute-workflow", status: "Pending" },
  { name: "Leaderboard Update", url: "/api/cron/leaderboard", status: "Pending" },
];

export function SystemMonitor() {
  const [activeTab, setActiveTab] = useState('overview');
  const [pulse, setPulse] = useState<PulseData | null>(null);
  const [cronJobs, setCronJobs] = useState<CronJobInfo[]>(INITIAL_CRON_JOBS);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isTriggering, setIsTriggering] = useState<string | null>(null);

  const fetchPulse = async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/system/pulse');
      if (res.ok) {
        const data = await res.json();
        setPulse(data);
        setLastUpdate(new Date());
      } else {
        toast({ variant: 'destructive', title: 'Failed to fetch system pulse' });
      }
    } catch (err: any) {
      toast({ variant: 'destructive', title: 'Network error', description: err.message });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTriggerJob = async (url: string) => {
    setIsTriggering(url);
    try {
      const res = await fetch(url, { method: 'POST' });
      if (res.ok) {
        toast({ title: 'Success', description: 'Job triggered' });
        setCronJobs(jobs => jobs.map(j => j.url === url ? { ...j, status: 'Success' as const, lastRun: new Date().toISOString() } : j));
      } else {
        toast({ title: 'Failed', description: 'Job failed', variant: 'destructive' });
        setCronJobs(jobs => jobs.map(j => j.url === url ? { ...j, status: 'Failed' as const, lastRun: new Date().toISOString() } : j));
      }
    } catch {
      toast({ title: 'Error', description: 'Network issue', variant: 'destructive' });
    } finally {
      setIsTriggering(null);
    }
  };

  useEffect(() => {
    fetchPulse();
    const interval = setInterval(fetchPulse, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500';
      case 'degraded': return 'bg-yellow-500';
      case 'down': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const memPct = pulse ? Math.round((pulse.metrics.memoryUsedMB / pulse.metrics.memoryTotalMB) * 100) : 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">সিস্টেম মনিটরিং (System Pulse)</h2>
          <p className="text-muted-foreground">Real-time DB latency, memory, errors, and slow queries</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchPulse} disabled={isLoading}>
            <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          {lastUpdate && (
            <span className="text-xs text-muted-foreground flex items-center">
              <Clock className="w-3 h-3 mr-1" />
              {lastUpdate.toLocaleTimeString()}
            </span>
          )}
        </div>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Database className="w-4 h-4" /> Database
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(pulse?.status.database || 'down')}`} />
              <span className="font-medium capitalize">{pulse?.status.database || 'unknown'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {pulse ? `${pulse.metrics.dbLatencyMs}ms ping` : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Server className="w-4 h-4" /> API Server
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(pulse?.status.api || 'down')}`} />
              <span className="font-medium capitalize">{pulse?.status.api || 'unknown'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {pulse ? `${Math.floor(pulse.metrics.uptimeSeconds / 60)}m uptime` : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="w-4 h-4" /> Memory
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <div className={`w-3 h-3 rounded-full ${getStatusColor(pulse?.status.memory || 'down')}`} />
              <span className="font-medium">{pulse ? `${memPct}%` : '--'}</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {pulse ? `${pulse.metrics.memoryUsedMB} / ${pulse.metrics.memoryTotalMB} MB` : '--'}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" /> Errors (24h)
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pulse?.metrics.totalErrors24h ?? '--'}</div>
            <div className="text-xs text-muted-foreground">{pulse?.metrics.errorRate24h ?? '--'} rate</div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 h-auto">
          <TabsTrigger value="overview">ওভারভিউ</TabsTrigger>
          <TabsTrigger value="slowqueries">Slow Queries</TabsTrigger>
          <TabsTrigger value="errors">Error Logs</TabsTrigger>
          <TabsTrigger value="cron">Cron Jobs</TabsTrigger>
        </TabsList>

        {/* Overview: Real Metrics */}
        <TabsContent value="overview" className="mt-4">
          {!pulse ? (
            <div className="text-center py-12 text-muted-foreground">Loading system pulse...</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              <Card><CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">DB Latency</div>
                <div className="text-2xl font-bold">{pulse.metrics.dbLatencyMs}<span className="text-xs ml-1">ms</span></div>
                <div className={`text-xs ${pulse.metrics.dbLatencyMs < 100 ? 'text-green-500' : pulse.metrics.dbLatencyMs < 500 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {pulse.metrics.dbLatencyMs < 100 ? <TrendingUp className="w-3 h-3 inline" /> : <TrendingDown className="w-3 h-3 inline" />}
                  {pulse.metrics.dbLatencyMs < 100 ? 'Fast' : pulse.metrics.dbLatencyMs < 500 ? 'Okay' : 'Slow'}
                </div>
              </CardContent></Card>

              <Card><CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Memory Used</div>
                <div className="text-2xl font-bold">{pulse.metrics.memoryUsedMB}<span className="text-xs ml-1">MB</span></div>
                <div className={`text-xs ${memPct < 70 ? 'text-green-500' : memPct < 90 ? 'text-yellow-500' : 'text-red-500'}`}>
                  {memPct}%
                </div>
              </CardContent></Card>

              <Card><CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">RSS Memory</div>
                <div className="text-2xl font-bold">{pulse.metrics.memoryRSSMB}<span className="text-xs ml-1">MB</span></div>
              </CardContent></Card>

              <Card><CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Uptime</div>
                <div className="text-2xl font-bold">{Math.floor(pulse.metrics.uptimeSeconds / 3600)}<span className="text-xs ml-1">h</span></div>
                <div className="text-xs text-green-500">{Math.floor((pulse.metrics.uptimeSeconds % 3600) / 60)}m</div>
              </CardContent></Card>

              <Card><CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Errors (24h)</div>
                <div className="text-2xl font-bold">{pulse.metrics.totalErrors24h}</div>
              </CardContent></Card>

              <Card><CardContent className="pt-4">
                <div className="text-sm text-muted-foreground">Slow Queries</div>
                <div className="text-2xl font-bold">{pulse.slowQueries.length}</div>
              </CardContent></Card>
            </div>
          )}
        </TabsContent>

        {/* Slow Queries */}
        <TabsContent value="slowqueries" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><BarChart3 className="w-4 h-4" /> Slow Queries (pg_stat_statements)</CardTitle>
            </CardHeader>
            <CardContent>
              {!pulse || pulse.slowQueries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No slow queries detected</p>
                  <p className="text-xs mt-1">pg_stat_statements extension may need enabling</p>
                </div>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {pulse.slowQueries.map((sq, i) => (
                    <div key={i} className="p-3 border rounded-lg bg-slate-50">
                      <div className="flex justify-between items-start">
                        <code className="text-xs font-mono bg-gray-200 px-2 py-1 rounded truncate max-w-md">{sq.query.substring(0, 120)}...</code>
                        <Badge variant="outline">{Math.round(sq.mean_exec_time)}ms avg</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1 flex gap-4">
                        <span>{sq.calls} calls</span>
                        <span>{sq.rows} rows</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Error Logs */}
        <TabsContent value="errors" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><AlertTriangle className="w-4 h-4" /> System Errors (24h)</CardTitle>
            </CardHeader>
            <CardContent>
              {!pulse || pulse.recentErrors.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                  <p>No recent errors</p>
                </div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {pulse.recentErrors.map((log) => (
                    <div key={log.id} className={`p-3 rounded-lg ${
                      log.level === 'critical' || log.level === 'alert' ? 'bg-red-50 text-red-700' :
                      log.level === 'warn' ? 'bg-yellow-50 text-yellow-700' : 'bg-blue-50 text-blue-700'
                    }`}>
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-2">
                          {log.level === 'critical' || log.level === 'alert' ? <AlertTriangle className="w-4 h-4" /> :
                           log.level === 'warn' ? <AlertTriangle className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                          <span className="font-medium">{log.source}</span>
                          {log.route && <code className="text-xs bg-white/50 px-1 rounded">{log.method} {log.route}</code>}
                        </div>
                        <span className="text-xs text-muted-foreground">{new Date(log.created_at).toLocaleString()}</span>
                      </div>
                      <p className="mt-1 text-sm">{log.message}</p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cron Jobs */}
        <TabsContent value="cron" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Cron Jobs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {cronJobs.map((job, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg bg-slate-50">
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${job.status === 'Success' ? 'bg-emerald-100' : job.status === 'Failed' ? 'bg-red-100' : 'bg-gray-100'}`}>
                        {job.status === 'Success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> :
                         job.status === 'Failed' ? <AlertTriangle className="w-5 h-5 text-red-600" /> : <Clock className="w-5 h-5 text-gray-600" />}
                      </div>
                      <div>
                        <div className="font-semibold">{job.name}</div>
                        <code className="text-xs font-mono bg-gray-200 px-1 rounded">{job.url}</code>
                        {job.lastRun && <div className="text-[10px] text-gray-500 mt-1">Last: {new Date(job.lastRun).toLocaleString()}</div>}
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Badge variant={job.status === 'Success' ? 'default' : job.status === 'Failed' ? 'destructive' : 'outline'}>{job.status}</Badge>
                      <Button size="sm" onClick={() => handleTriggerJob(job.url)} disabled={isTriggering === job.url}>
                        {isTriggering === job.url ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                        Run
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
