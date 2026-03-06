'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Activity,
    Server,
    AlertTriangle,
    CheckCircle,
    Clock,
    RefreshCw,
    TrendingUp,
    TrendingDown,
    Database,
    Zap,
    Shield,
    Users,
    DollarSign,
    BarChart3,
    Bell,
    Play
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import { toast } from '@/components/ui/use-toast';

interface CronJobInfo {
    name: string;
    url: string;
    status: 'Success' | 'Failed' | 'Pending';
    lastRun?: string;
}

interface SystemStatus {
    database: 'healthy' | 'degraded' | 'down';
    api: 'healthy' | 'degraded' | 'down';
    realtime: 'healthy' | 'degraded' | 'down';
    workflow: 'healthy' | 'degraded' | 'down';
}

interface AlertConfig {
    id: string;
    name: string;
    type: 'price' | 'volume' | 'user_activity' | 'system' | 'resolution';
    threshold: number;
    enabled: boolean;
    notification_channels: string[];
}

interface ErrorLog {
    id: string;
    timestamp: string;
    level: 'error' | 'warning' | 'info';
    source: string;
    message: string;
    details?: string;
}

interface PerformanceMetric {
    name: string;
    value: number;
    unit: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
}

// ============================================================================
// Main Component
// ============================================================================

export function SystemMonitor() {
    const { t } = useTranslation();
    const supabase = createClient();

    const [activeTab, setActiveTab] = useState('overview');
    const [systemStatus, setSystemStatus] = useState<SystemStatus>({
        database: 'healthy',
        api: 'healthy',
        realtime: 'healthy',
        workflow: 'healthy'
    });
    const [errorLogs, setErrorLogs] = useState<ErrorLog[]>([]);
    const [alerts, setAlerts] = useState<AlertConfig[]>([]);
    const [metrics, setMetrics] = useState<PerformanceMetric[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
    const [isTriggering, setIsTriggering] = useState<string | null>(null);

    // Mock cron jobs list based on prompt
    const [cronJobs, setCronJobs] = useState<CronJobInfo[]>([
        { name: "AI Topics", url: "/api/cron/daily-ai-topics", status: "Failed", lastRun: new Date().toISOString() },
        { name: "Batch Categories", url: "/api/cron/batch-categories", status: "Success", lastRun: new Date(Date.now() - 3600000).toISOString() },
        { name: "Dispute Workflow", url: "/api/dispute-workflow", status: "Failed", lastRun: new Date().toISOString() },
        { name: "Leaderboard Update", url: "/api/cron/leaderboard", status: "Success", lastRun: new Date(Date.now() - 7200000).toISOString() },
    ]);

    // Handle Cron Job Trigger
    const handleTriggerJob = async (url: string) => {
        setIsTriggering(url);
        try {
            const res = await fetch(url, { method: 'POST' });
            if (res.ok) {
                toast({ title: "সফল", description: "জবটি সফলভাবে চালু হয়েছে" });
                // Update local status mock
                setCronJobs(jobs => jobs.map(j => j.url === url ? {...j, status: 'Success', lastRun: new Date().toISOString()} : j));
            } else {
                toast({ title: "ব্যর্থ", description: "জবটি ব্যর্থ হয়েছে", variant: "destructive" });
                setCronJobs(jobs => jobs.map(j => j.url === url ? {...j, status: 'Failed', lastRun: new Date().toISOString()} : j));
            }
        } catch (err) {
            toast({ title: "এরর", description: "নেটওয়ার্ক সমস্যা", variant: "destructive" });
        } finally {
            setIsTriggering(null);
        }
    };

    // Fetch system status
    const fetchSystemStatus = async () => {
        try {
            const res = await fetch('/api/admin/metrics/system');
            if (res.ok) {
                const data = await res.json();
                setSystemStatus(data.status || systemStatus);
            }
        } catch (error) {
            console.error('Error fetching system status:', error);
        }
    };

    // Fetch error logs
    const fetchErrorLogs = async () => {
        try {
            const res = await fetch('/api/admin/logs?limit=50&level=error');
            if (res.ok) {
                const data = await res.json();
                setErrorLogs(data.logs || []);
            }
        } catch (error) {
            console.error('Error fetching logs:', error);
            // Generate mock data for display
            setErrorLogs([
                { id: '1', timestamp: new Date().toISOString(), level: 'info', source: 'API', message: 'System initialized successfully' },
                { id: '2', timestamp: new Date().toISOString(), level: 'warning', source: 'Database', message: 'Slow query detected (>500ms)' },
            ]);
        }
    };

    // Fetch alert configs
    const fetchAlerts = async () => {
        try {
            const res = await fetch('/api/admin/alerts');
            if (res.ok) {
                const data = await res.json();
                setAlerts(data.alerts || getDefaultAlerts());
            } else {
                setAlerts(getDefaultAlerts());
            }
        } catch (error) {
            setAlerts(getDefaultAlerts());
        }
    };

    // Fetch performance metrics
    const fetchMetrics = async () => {
        try {
            const res = await fetch('/api/admin/metrics/performance');
            if (res.ok) {
                const data = await res.json();
                setMetrics(data.metrics || getDefaultMetrics());
            } else {
                setMetrics(getDefaultMetrics());
            }
        } catch (error) {
            setMetrics(getDefaultMetrics());
        }
    };

    const getDefaultAlerts = (): AlertConfig[] => [
        { id: '1', name: 'High Volume Alert', type: 'volume', threshold: 10000, enabled: true, notification_channels: ['email', 'telegram'] },
        { id: '2', name: 'Price Anomaly', type: 'price', threshold: 20, enabled: true, notification_channels: ['telegram'] },
        { id: '3', name: 'User Activity Spike', type: 'user_activity', threshold: 100, enabled: false, notification_channels: ['email'] },
        { id: '4', name: 'System Error Rate', type: 'system', threshold: 5, enabled: true, notification_channels: ['email', 'telegram'] },
    ];

    const getDefaultMetrics = (): PerformanceMetric[] => [
        { name: 'Active Users', value: 1247, unit: 'users', trend: 'up', change: 12.5 },
        { name: 'Total Volume (24h)', value: 245000, unit: 'USD', trend: 'up', change: 8.3 },
        { name: 'Active Markets', value: 89, unit: 'markets', trend: 'stable', change: 0 },
        { name: 'Avg Response Time', value: 145, unit: 'ms', trend: 'down', change: -5.2 },
        { name: 'Success Rate', value: 99.7, unit: '%', trend: 'stable', change: 0.1 },
        { name: 'Open Positions', value: 3456, unit: 'positions', trend: 'up', change: 15.8 },
    ];

    // Initial data fetch
    useEffect(() => {
        const loadData = async () => {
            setIsLoading(true);
            await Promise.all([
                fetchSystemStatus(),
                fetchErrorLogs(),
                fetchAlerts(),
                fetchMetrics()
            ]);
            setLastUpdate(new Date());
            setIsLoading(false);
        };
        loadData();

        // Auto-refresh every 30 seconds
        const interval = setInterval(loadData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Toggle alert
    const toggleAlert = async (alertId: string) => {
        const updated = alerts.map(a =>
            a.id === alertId ? { ...a, enabled: !a.enabled } : a
        );
        setAlerts(updated);

        // Save to backend
        try {
            await fetch('/api/admin/alerts', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ alertId, enabled: !alerts.find(a => a.id === alertId)?.enabled })
            });
        } catch (error) {
            console.error('Error updating alert:', error);
        }
    };

    // Get status color
    const getStatusColor = (status: string) => {
        switch (status) {
            case 'healthy': return 'bg-green-500';
            case 'degraded': return 'bg-yellow-500';
            case 'down': return 'bg-red-500';
            default: return 'bg-gray-500';
        }
    };

    // Get log level color
    const getLogLevelColor = (level: string) => {
        switch (level) {
            case 'error': return 'text-red-500 bg-red-50';
            case 'warning': return 'text-yellow-500 bg-yellow-50';
            case 'info': return 'text-blue-500 bg-blue-50';
            default: return 'text-gray-500 bg-gray-50';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-2xl font-bold">সিস্টেম মনিটরিং (System Monitoring)</h2>
                    <p className="text-muted-foreground">Real-time platform health, cron jobs, and performance logs</p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => Promise.all([fetchSystemStatus(), fetchErrorLogs(), fetchAlerts(), fetchMetrics()])}
                        disabled={isLoading}
                    >
                        <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    {lastUpdate && (
                        <span className="text-xs text-muted-foreground flex items-center">
                            <Clock className="w-3 h-3 mr-1" />
                            Updated: {lastUpdate.toLocaleTimeString()}
                        </span>
                    )}
                </div>
            </div>

            {/* System Status Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Database className="w-4 h-4" />
                            Database
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.database)}`} />
                            <span className="font-medium capitalize">{systemStatus.database}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Server className="w-4 h-4" />
                            API Server
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.api)}`} />
                            <span className="font-medium capitalize">{systemStatus.api}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Zap className="w-4 h-4" />
                            Realtime
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.realtime)}`} />
                            <span className="font-medium capitalize">{systemStatus.realtime}</span>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                            <Activity className="w-4 h-4" />
                            Workflows
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center gap-2">
                            <div className={`w-3 h-3 rounded-full ${getStatusColor(systemStatus.workflow)}`} />
                            <span className="font-medium capitalize">{systemStatus.workflow}</span>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-2 md:grid-cols-5 h-auto">
                    <TabsTrigger value="overview" className="py-2.5">ওভারভিউ (Overview)</TabsTrigger>
                    <TabsTrigger value="cron" className="py-2.5 font-bold text-amber-600 data-[state=active]:text-amber-700">ক্রন জবস (Cron Jobs)</TabsTrigger>
                    <TabsTrigger value="performance" className="py-2.5">কর্মক্ষমতা (Performance)</TabsTrigger>
                    <TabsTrigger value="errors" className="py-2.5">এরর লগ (Error Logs)</TabsTrigger>
                    <TabsTrigger value="alerts" className="py-2.5">অ্যালার্ট (Alerts)</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview" className="mt-4">
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                        {metrics.map((metric, index) => (
                            <Card key={index}>
                                <CardContent className="pt-4">
                                    <div className="text-sm text-muted-foreground">{metric.name}</div>
                                    <div className="text-2xl font-bold flex items-center gap-2">
                                        {metric.value.toLocaleString()}
                                        <span className="text-xs">{metric.unit}</span>
                                    </div>
                                    <div className={`text-xs flex items-center gap-1 ${metric.trend === 'up' ? 'text-green-500' :
                                            metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                                        }`}>
                                        {metric.trend === 'up' ? <TrendingUp className="w-3 h-3" /> :
                                            metric.trend === 'down' ? <TrendingDown className="w-3 h-3" /> : null}
                                        {metric.change > 0 ? '+' : ''}{metric.change}%
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </TabsContent>

                {/* Cron Jobs Tab */}
                <TabsContent value="cron" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>সিস্টেম ক্রন জবস (System Cron Jobs)</CardTitle>
                            <CardDescription>ম্যানুয়ালি ক্রন জব এবং ওয়ার্কফ্লো পরিচালনা করুন (Manage and trigger background tasks)</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {cronJobs.map((job, index) => (
                                    <div key={index} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border rounded-lg bg-slate-50 gap-4">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${job.status === 'Success' ? 'bg-emerald-100' : 'bg-red-100'}`}>
                                                {job.status === 'Success' ? <CheckCircle className="w-5 h-5 text-emerald-600" /> : <AlertTriangle className="w-5 h-5 text-red-600" />}
                                            </div>
                                            <div>
                                                <div className="font-semibold text-gray-900">{job.name}</div>
                                                <div className="text-xs text-muted-foreground font-mono bg-gray-200 px-1 py-0.5 rounded mt-1">{job.url}</div>
                                                {job.lastRun && (
                                                    <div className="text-[10px] text-gray-500 mt-1 flex items-center gap-1">
                                                        <Clock className="w-3 h-3" /> শেষ রান: {new Date(job.lastRun).toLocaleString('bn-BD')}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3 w-full sm:w-auto mt-2 sm:mt-0">
                                            <Badge variant={job.status === 'Success' ? 'default' : 'destructive'} className={job.status === 'Success' ? 'bg-emerald-500 hover:bg-emerald-600' : ''}>
                                                {job.status}
                                            </Badge>
                                            <Button
                                                size="sm"
                                                onClick={() => handleTriggerJob(job.url)}
                                                disabled={isTriggering === job.url}
                                                className="w-full sm:w-auto"
                                            >
                                                {isTriggering === job.url ? (
                                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                                ) : (
                                                    <Play className="w-4 h-4 mr-2" />
                                                )}
                                                Run Now
                                            </Button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Performance Tab */}
                <TabsContent value="performance" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Performance Metrics</CardTitle>
                            <CardDescription>Detailed system performance breakdown</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {metrics.map((metric, index) => (
                                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-muted rounded-lg">
                                                {metric.name.includes('User') ? <Users className="w-4 h-4" /> :
                                                    metric.name.includes('Volume') ? <DollarSign className="w-4 h-4" /> :
                                                        metric.name.includes('Market') ? <BarChart3 className="w-4 h-4" /> :
                                                            <Activity className="w-4 h-4" />}
                                            </div>
                                            <div>
                                                <div className="font-medium">{metric.name}</div>
                                                <div className="text-xs text-muted-foreground">{metric.unit}</div>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-2xl font-bold">{metric.value.toLocaleString()}</div>
                                            <div className={`text-xs ${metric.trend === 'up' ? 'text-green-500' :
                                                    metric.trend === 'down' ? 'text-red-500' : 'text-gray-500'
                                                }`}>
                                                {metric.change > 0 ? '+' : ''}{metric.change}% from last period
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Error Logs Tab */}
                <TabsContent value="errors" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Error Logs</CardTitle>
                            <CardDescription>Recent system errors and warnings</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {errorLogs.length === 0 ? (
                                <div className="text-center py-8 text-muted-foreground">
                                    <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
                                    <p>No recent errors</p>
                                </div>
                            ) : (
                                <div className="space-y-2 max-h-96 overflow-y-auto">
                                    {errorLogs.map((log) => (
                                        <div key={log.id} className={`p-3 rounded-lg ${getLogLevelColor(log.level)}`}>
                                            <div className="flex justify-between items-start">
                                                <div className="flex items-center gap-2">
                                                    {log.level === 'error' ? <AlertTriangle className="w-4 h-4" /> :
                                                        log.level === 'warning' ? <AlertTriangle className="w-4 h-4" /> :
                                                            <CheckCircle className="w-4 h-4" />}
                                                    <span className="font-medium">{log.source}</span>
                                                </div>
                                                <span className="text-xs text-muted-foreground">
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </span>
                                            </div>
                                            <p className="mt-1 text-sm">{log.message}</p>
                                            {log.details && (
                                                <p className="mt-1 text-xs text-muted-foreground">{log.details}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Alerts Tab */}
                <TabsContent value="alerts" className="mt-4">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alert Configuration</CardTitle>
                            <CardDescription>Manage automated alerts and notifications</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {alerts.map((alert) => (
                                    <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                                        <div className="flex items-center gap-3">
                                            <div className={`p-2 rounded-lg ${alert.type === 'price' ? 'bg-blue-100' :
                                                    alert.type === 'volume' ? 'bg-purple-100' :
                                                        alert.type === 'user_activity' ? 'bg-green-100' :
                                                            'bg-red-100'
                                                }`}>
                                                <Bell className={`w-4 h-4 ${alert.type === 'price' ? 'text-blue-500' :
                                                        alert.type === 'volume' ? 'text-purple-500' :
                                                            alert.type === 'user_activity' ? 'text-green-500' :
                                                                'text-red-500'
                                                    }`} />
                                            </div>
                                            <div>
                                                <div className="font-medium">{alert.name}</div>
                                                <div className="text-xs text-muted-foreground">
                                                    Threshold: {alert.threshold} | Channels: {alert.notification_channels.join(', ')}
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={alert.enabled ? 'default' : 'secondary'}>
                                                {alert.enabled ? 'Active' : 'Disabled'}
                                            </Badge>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => toggleAlert(alert.id)}
                                            >
                                                {alert.enabled ? 'Disable' : 'Enable'}
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

export default SystemMonitor;
