/**
 * Latency Metrics Component
 * 
 * Displays:
 * - Real-time latency percentiles (p50, p99, p999)
 * - Throughput metrics
 * - Operation type breakdown
 * - Performance visualization
 */

'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useMatchingEngine } from '@/hooks/useMatchingEngine';
import {
  Activity,
  Zap,
  Clock,
  TrendingUp,
  TrendingDown,
  Server,
  Database,
  Bell,
} from 'lucide-react';

interface LatencyMetricsProps {
  marketId: string;
  userId: string;
}

interface MetricCardProps {
  title: string;
  value: string;
  unit: string;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  color?: string;
}

function MetricCard({ title, value, unit, icon, trend, color = 'bg-primary' }: MetricCardProps) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <div className="flex items-center justify-between">
        <div className={`p-2 rounded-md ${color} bg-opacity-10`}>
          {icon}
        </div>
        {trend && (
          <div className={`flex items-center ${trend === 'up' ? 'text-green-600' : trend === 'down' ? 'text-red-600' : 'text-gray-500'}`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : trend === 'down' ? <TrendingDown className="h-3 w-3" /> : null}
          </div>
        )}
      </div>
      <div className="mt-2">
        <div className="text-2xl font-bold">{value}</div>
        <div className="text-xs text-muted-foreground">{unit}</div>
      </div>
      <div className="text-xs text-muted-foreground mt-1">{title}</div>
    </div>
  );
}

export function LatencyMetrics({
  marketId,
  userId,
}: LatencyMetricsProps) {
  const { metrics, refreshMetrics } = useMatchingEngine(marketId, userId);
  const [lastUpdate, setLastUpdate] = useState(Date.now());

  // Auto-refresh metrics
  useEffect(() => {
    const interval = setInterval(() => {
      refreshMetrics();
      setLastUpdate(Date.now());
    }, 5000); // Every 5 seconds

    return () => clearInterval(interval);
  }, [refreshMetrics]);

  // Determine status based on latency
  const getLatencyStatus = (latency: number) => {
    if (latency < 100) return { color: 'bg-green-500', label: 'Excellent' };
    if (latency < 500) return { color: 'bg-yellow-500', label: 'Good' };
    return { color: 'bg-red-500', label: 'High' };
  };

  const p50Status = getLatencyStatus(metrics.p50Latency);
  const p99Status = getLatencyStatus(metrics.p99Latency);

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Activity className="h-4 w-4" />
            Matching Engine Performance
          </CardTitle>
          <Badge variant="outline" className="text-xs">
            Live
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Key Metrics Grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            title="p50 Latency"
            value={metrics.p50Latency.toString()}
            unit="μs"
            icon={<Clock className="h-4 w-4 text-primary" />}
            trend={metrics.p50Latency < 100 ? 'down' : 'up'}
            color="bg-blue-500"
          />
          <MetricCard
            title="p99 Latency"
            value={metrics.p99Latency.toString()}
            unit="μs"
            icon={<Zap className="h-4 w-4 text-yellow-500" />}
            trend={metrics.p99Latency < 500 ? 'down' : 'up'}
            color="bg-yellow-500"
          />
          <MetricCard
            title="Throughput"
            value={metrics.throughput.toFixed(0)}
            unit="ops/sec"
            icon={<Server className="h-4 w-4 text-green-500" />}
            color="bg-green-500"
          />
          <MetricCard
            title="Total Operations"
            value={metrics.operationCount.toLocaleString()}
            unit="ops"
            icon={<Database className="h-4 w-4 text-purple-500" />}
            color="bg-purple-500"
          />
        </div>

        {/* Latency Distribution */}
        <div className="space-y-3">
          <h4 className="text-sm font-medium">Latency Distribution</h4>
          
          {/* p50 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">p50 (Median)</span>
              <span className="font-medium">{metrics.p50Latency} μs</span>
            </div>
            <Progress
              value={Math.min((metrics.p50Latency / 500) * 100, 100)}
              className={`h-2 ${p50Status.color}`}
            />
            <div className="flex justify-between text-xs">
              <span className={p50Status.color.replace('bg-', 'text-')}>
                {p50Status.label}
              </span>
              <span className="text-muted-foreground">Target: &lt;100 μs</span>
            </div>
          </div>

          {/* p99 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">p99</span>
              <span className="font-medium">{metrics.p99Latency} μs</span>
            </div>
            <Progress
              value={Math.min((metrics.p99Latency / 1000) * 100, 100)}
              className={`h-2 ${p99Status.color}`}
            />
            <div className="flex justify-between text-xs">
              <span className={p99Status.color.replace('bg-', 'text-')}>
                {p99Status.label}
              </span>
              <span className="text-muted-foreground">Target: &lt;500 μs</span>
            </div>
          </div>
        </div>

        {/* Performance Targets */}
        <div className="rounded-lg bg-muted p-3 text-sm">
          <h4 className="font-medium mb-2 flex items-center gap-2">
            <Bell className="h-4 w-4" />
            Performance Targets
          </h4>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Enqueue/Dequeue:</span>
              <span className="font-medium">&lt; 10 μs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Match:</span>
              <span className="font-medium">&lt; 500 μs</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Notify:</span>
              <span className="font-medium">&lt; 1 ms</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Throughput:</span>
              <span className="font-medium">100,000+ orders/sec</span>
            </div>
          </div>
        </div>

        {/* Last Update */}
        <div className="text-xs text-muted-foreground text-center">
          Last updated: {new Date(lastUpdate).toLocaleTimeString()}
        </div>
      </CardContent>
    </Card>
  );
}

export default LatencyMetrics;
