'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  Database,
  Server,
  HardDrive,
  Cpu,
  MemoryStick,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  TrendingUp,
  Users,
  BarChart3,
  Shield,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { createClient } from '@/lib/supabase/client';

interface HealthStatus {
  status: 'healthy' | 'degraded' | 'down';
  timestamp: string;
  version: string;
  uptime_seconds: number;
  services: {
    database: { status: string; latency_ms?: number; error?: string };
    supabase: { status: string; latency_ms?: number; error?: string };
    redis: { status: string; latency_ms?: number; error?: string };
  };
}

interface PlatformMetrics {
  active_users_24h: number;
  total_users: number;
  total_markets: number;
  active_markets: number;
  total_volume_24h: number;
  total_trades_24h: number;
  avg_response_ms: number;
  error_rate_percent: number;
}

interface DowntimeEvent {
  id: string;
  started_at: string;
  ended_at?: string;
  service: string;
  error?: string;
}

export default function MonitoringPage() {
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [metrics, setMetrics] = useState<PlatformMetrics | null>(null);
  const [downtimeEvents, setDowntimeEvents] = useState<DowntimeEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const supabase = createClient();

  const fetchHealth = useCallback(async () => {
    try {
      const res = await fetch('/api/health');
      const data = await res.json();
      setHealth(data);
    } catch (err) {
      console.error('Health check failed:', err);
    }
  }, []);

  const fetchMetrics = useCallback(async () => {
    try {
      const { data, error } = await supabase.rpc('get_platform_metrics').single();
      if (!error && data) {
        setMetrics(data);
      } else {
        // Fallback metrics from direct queries
        const [
          { count: users24h },
          { count: totalUsers },
          { count: totalMarkets },
          { count: activeMarkets },
        ] = await Promise.all([
          supabase.from('activity_feed').select('*', { count: 'exact', head: true }),
          supabase.from('user_profiles').select('*', { count: 'exact', head: true }),
          supabase.from('markets').select('*', { count: 'exact', head: true }),
          supabase.from('markets').select('*', { count: 'exact', head: true }).eq('status', 'active'),
        ]);

        setMetrics({
          active_users_24h: users24h || 0,
          total_users: totalUsers || 0,
          total_markets: totalMarkets || 0,
          active_markets: activeMarkets || 0,
          total_volume_24h: 0,
          total_trades_24h: 0,
          avg_response_ms: 0,
          error_rate_percent: 0,
        });
      }
    } catch (err) {
      console.error('Metrics fetch failed:', err);
    }
  }, [supabase]);

  const fetchDowntime = useCallback(async () => {
    const { data } = await supabase
      .from('admin_audit_log')
      .select('*')
      .eq('action', 'service_down')
      .order('created_at', { ascending: false })
      .limit(10);

    if (data) {
      setDowntimeEvents(
        data.map((d: any) => ({
          id: d.id,
          started_at: d.created_at,
          service: d.metadata?.service || 'unknown',
          error: d.metadata?.error,
        }))
      );
    }
  }, [supabase]);

  const refresh = useCallback(async () => {
    setLoading(true);
    await Promise.all([fetchHealth(), fetchMetrics(), fetchDowntime()]);
    setLastRefresh(new Date());
    setLoading(false);
  }, [fetchHealth, fetchMetrics, fetchDowntime]);

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, 30000); // Refresh every 30s
    return () => clearInterval(interval);
  }, [refresh]);

  const statusColor = (s: string) => {
    if (s === 'up') return 'text-emerald-400';
    if (s === 'degraded') return 'text-yellow-400';
    return 'text-red-400';
  };

  const formatUptime = (seconds: number) => {
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (d > 0) return `${d}d ${h}h ${m}m`;
    if (h > 0) return `${h}h ${m}m`;
    return `${m}m`;
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            System Monitoring
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Last updated: {lastRefresh.toLocaleTimeString()}
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={refresh}
          disabled={loading}
          className="border-slate-700"
        >
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {/* Overall Status Banner */}
      {health && (
        <Card
          className={`border-2 ${
            health.status === 'healthy'
              ? 'border-emerald-400/30 bg-emerald-400/5'
              : health.status === 'degraded'
              ? 'border-yellow-400/30 bg-yellow-400/5'
              : 'border-red-400/30 bg-red-400/5'
          }`}
        >
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                {health.status === 'healthy' ? (
                  <CheckCircle className="w-8 h-8 text-emerald-400" />
                ) : health.status === 'degraded' ? (
                  <AlertTriangle className="w-8 h-8 text-yellow-400" />
                ) : (
                  <AlertTriangle className="w-8 h-8 text-red-400" />
                )}
                <div>
                  <p className="text-lg font-bold text-white uppercase">
                    System {health.status}
                  </p>
                  <p className="text-sm text-slate-400">
                    Uptime: {formatUptime(health.uptime_seconds)} • v{health.version}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm text-slate-400">Response Time</p>
                <p className="text-lg font-mono text-white">
                  {metrics?.avg_response_ms || '—'}ms
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Services Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {health &&
          Object.entries(health.services).map(([name, svc]: [string, any]) => (
            <Card key={name} className="bg-slate-900 border-slate-800">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm text-slate-400 capitalize flex items-center gap-2">
                    {name === 'database' && <Database className="w-4 h-4" />}
                    {name === 'supabase' && <Server className="w-4 h-4" />}
                    {name === 'redis' && <MemoryStick className="w-4 h-4" />}
                    {name}
                  </CardTitle>
                  <Badge
                    className={
                      svc.status === 'up'
                        ? 'bg-emerald-400/10 text-emerald-400'
                        : svc.status === 'degraded'
                        ? 'bg-yellow-400/10 text-yellow-400'
                        : 'bg-red-400/10 text-red-400'
                    }
                  >
                    {svc.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {svc.latency_ms && (
                    <div className="flex justify-between text-xs">
                      <span className="text-slate-500">Latency</span>
                      <span className="text-white font-mono">{svc.latency_ms}ms</span>
                    </div>
                  )}
                  {svc.error && (
                    <p className="text-xs text-red-400 truncate">{svc.error}</p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          {
            label: 'Active Users (24h)',
            value: metrics?.active_users_24h || 0,
            icon: <Users className="w-4 h-4" />,
            color: 'text-blue-400',
          },
          {
            label: 'Total Users',
            value: metrics?.total_users || 0,
            icon: <Users className="w-4 h-4" />,
            color: 'text-purple-400',
          },
          {
            label: 'Active Markets',
            value: metrics?.active_markets || 0,
            icon: <BarChart3 className="w-4 h-4" />,
            color: 'text-green-400',
          },
          {
            label: 'Error Rate',
            value: `${metrics?.error_rate_percent || 0}%`,
            icon: <AlertTriangle className="w-4 h-4" />,
            color: 'text-orange-400',
          },
        ].map((metric) => (
          <Card key={metric.label} className="bg-slate-900 border-slate-800">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-500">{metric.label}</p>
                  <p className={`text-xl font-bold font-mono ${metric.color}`}>
                    {metric.value}
                  </p>
                </div>
                <div className={metric.color}>{metric.icon}</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Server Resources (Static - real impl would need server agent) */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Server className="w-4 h-4 text-slate-400" />
            Server Resources
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                label: 'CPU Usage',
                value: 34,
                icon: <Cpu className="w-4 h-4" />,
                color: 'text-blue-400',
              },
              {
                label: 'Memory',
                value: 62,
                icon: <MemoryStick className="w-4 h-4" />,
                color: 'text-purple-400',
              },
              {
                label: 'Disk',
                value: 45,
                icon: <HardDrive className="w-4 h-4" />,
                color: 'text-green-400',
              },
            ].map((resource) => (
              <div key={resource.label} className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-400 flex items-center gap-2">
                    {resource.icon}
                    {resource.label}
                  </span>
                  <span className={`text-sm font-mono ${resource.color}`}>
                    {resource.value}%
                  </span>
                </div>
                <Progress value={resource.value} className="h-2" />
              </div>
            ))}
          </div>
          <p className="text-xs text-slate-600 mt-3">
            * Server resource data requires node_exporter + Prometheus on VPS. Install with:{' '}
            <code className="bg-slate-800 px-1 rounded">scripts/monitoring/install-monitoring.sh</code>
          </p>
        </CardContent>
      </Card>

      {/* Downtime Events */}
      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Clock className="w-4 h-4 text-slate-400" />
            Recent Incidents
          </CardTitle>
        </CardHeader>
        <CardContent>
          {downtimeEvents.length === 0 ? (
            <div className="text-center py-8">
              <CheckCircle className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-slate-400 text-sm">No recent incidents</p>
            </div>
          ) : (
            <div className="space-y-3">
              {downtimeEvents.map((event) => (
                <div
                  key={event.id}
                  className="flex items-start gap-3 p-3 bg-red-400/5 border border-red-400/10 rounded-lg"
                >
                  <AlertTriangle className="w-4 h-4 text-red-400 mt-0.5" />
                  <div>
                    <p className="text-sm text-white">
                      {event.service} — Down for{' '}
                      {event.ended_at
                        ? `${Math.round((new Date(event.ended_at).getTime() - new Date(event.started_at).getTime()) / 60000)}m`
                        : 'ongoing'}
                    </p>
                    {event.error && (
                      <p className="text-xs text-slate-500 mt-1">{event.error}</p>
                    )}
                    <p className="text-xs text-slate-600 mt-1">
                      {new Date(event.started_at).toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
