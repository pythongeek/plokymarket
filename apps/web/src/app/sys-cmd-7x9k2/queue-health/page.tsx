'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
  RefreshCw,
  Server,
  Zap,
  XCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';

interface QueueHealth {
  timestamp: string;
  dlq: {
    messageCount: number;
    oldestMessageAgeMs?: number;
  };
  circuitBreakers: {
    service: string;
    status: 'closed' | 'open' | 'half_open';
    failures: number;
    openedAt?: number;
  }[];
  alertsSent: number;
  alerts: string[];
}

export default function QueueHealthPage() {
  const [health, setHealth] = useState<QueueHealth | null>(null);
  const [loading, setLoading] = useState(false);
  const [lastRefresh, setLastRefresh] = useState<Date>(new Date());
  const [error, setError] = useState<string | null>(null);

  const fetchHealth = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/cron/queue-health', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      });
      const data = await res.json();
      if (data.success) {
        setHealth(data);
      } else {
        setError(data.error || 'Unknown error');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
      setLastRefresh(new Date());
    }
  }, []);

  useEffect(() => {
    fetchHealth();
  }, [fetchHealth]);

  const openBreakers = health?.circuitBreakers.filter((cb) => cb.status === 'open') || [];
  const dlqThreshold = 10;
  const dlqWarning = (health?.dlq.messageCount || 0) > dlqThreshold;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Queue Health</h1>
          <p className="text-muted-foreground mt-1">
            QStash DLQ, circuit breakers, and automation pipeline health
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">
            Last checked: {lastRefresh.toLocaleTimeString()}
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchHealth}
            disabled={loading}
          >
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>
      </div>

      <Separator />

      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">DLQ Messages</CardTitle>
            {dlqWarning ? (
              <AlertTriangle className="h-4 w-4 text-destructive" />
            ) : (
              <CheckCircle className="h-4 w-4 text-green-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.dlq.messageCount ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Threshold: {dlqThreshold}
              {dlqWarning && (
                <Badge variant="destructive" className="ml-2">
                  CRITICAL
                </Badge>
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">
              Circuit Breakers
            </CardTitle>
            <Zap className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {openBreakers.length} / {health?.circuitBreakers.length ?? 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {openBreakers.length === 0
                ? 'All circuits closed'
                : `${openBreakers.length} circuit(s) OPEN`}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Alerts Sent</CardTitle>
            <Activity className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {health?.alertsSent ?? '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              In last health check
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Circuit Breaker Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Server className="h-5 w-5" />
            Circuit Breaker Status
          </CardTitle>
        </CardHeader>
        <CardContent>
          {health?.circuitBreakers.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No circuit breakers tracked yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 px-3 font-medium">Service</th>
                    <th className="text-left py-2 px-3 font-medium">Status</th>
                    <th className="text-left py-2 px-3 font-medium">Failures</th>
                    <th className="text-left py-2 px-3 font-medium">Opened At</th>
                  </tr>
                </thead>
                <tbody>
                  {health?.circuitBreakers.map((cb) => (
                    <tr key={cb.service} className="border-b last:border-0">
                      <td className="py-2 px-3 font-mono">{cb.service}</td>
                      <td className="py-2 px-3">
                        <Badge
                          variant={
                            cb.status === 'open'
                              ? 'destructive'
                              : cb.status === 'half_open'
                              ? 'secondary'
                              : 'default'
                          }
                        >
                          {cb.status}
                        </Badge>
                      </td>
                      <td className="py-2 px-3">{cb.failures}</td>
                      <td className="py-2 px-3">
                        {cb.openedAt
                          ? new Date(cb.openedAt).toLocaleString()
                          : '-'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Recent Alerts */}
      {health && health.alerts.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" />
              Recent Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {health.alerts.map((alert, i) => (
                <li
                  key={i}
                  className="flex items-start gap-2 text-sm text-destructive"
                >
                  <XCircle className="h-4 w-4 mt-0.5 shrink-0" />
                  {alert}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <p className="text-destructive text-sm">
              <AlertTriangle className="h-4 w-4 inline mr-1" />
              {error}
            </p>
          </CardContent>
        </Card>
      )}

      {/* Manual Trigger */}
      <div className="flex items-center gap-4">
        <Button onClick={fetchHealth} disabled={loading} size="lg">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Trigger Health Check
        </Button>
        <p className="text-sm text-muted-foreground">
          Manually runs the same check as the 5-minute cron job.
        </p>
      </div>

      <Separator />

      {/* Footer */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Clock className="h-3 w-3" />
        Auto-refreshes every 5 minutes via QStash cron schedule.
      </div>
    </div>
  );
}
