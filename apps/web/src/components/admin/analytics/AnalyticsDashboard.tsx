'use client';

import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { RefreshCw, Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MetricCard } from './MetricCard';
import { VolumeChart } from './charts/VolumeChart';
import { UserGrowthChart } from './charts/UserGrowthChart';
import { RevenueChart } from './charts/RevenueChart';
import { RiskHeatmap } from './charts/RiskHeatmap';
import { AnalyticsService, AnalyticsPeriod, MetricType } from '@/lib/analytics/service';

export default function AnalyticsDashboard() {
    const { t } = useTranslation();
    const [period, setPeriod] = useState<AnalyticsPeriod>('24h');
    const [loading, setLoading] = useState(false);
    const [tradingData, setTradingData] = useState<any>(null);
    const [userData, setUserData] = useState<any>(null);
    const [financialData, setFinancialData] = useState<any>(null);
    const [riskData, setRiskData] = useState<any>(null);

    // Fetch data on load and when period changes
    useEffect(() => {
        fetchAnalytics();
    }, [period]);

    const fetchAnalytics = async () => {
        setLoading(true);
        try {
            // Fetch all categories in parallel for the dashboard view
            const service = new AnalyticsService();
            const [trading, users, financial, risk] = await Promise.all([
                service.getMetrics(period, 'trading'),
                service.getMetrics(period, 'users'),
                service.getMetrics(period, 'financial'),
                service.getMetrics(period, 'risk') // Assuming endpoint handles this
            ]);

            setTradingData(trading);
            setUserData(users);
            setFinancialData(financial);
            setRiskData(risk);
        } catch (error) {
            console.error('Failed to load analytics:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h2 className="text-3xl font-bold tracking-tight">{t('analytics.title', 'Platform Analytics')}</h2>
                    <p className="text-muted-foreground">{t('analytics.subtitle', 'Real-time overview of platform performance')}</p>
                </div>

                <div className="flex items-center gap-2">
                    <Select value={period} onValueChange={(v) => setPeriod(v as AnalyticsPeriod)}>
                        <SelectTrigger className="w-[120px]">
                            <SelectValue placeholder="Period" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="24h">Last 24 Hours</SelectItem>
                            <SelectItem value="7d">Last 7 Days</SelectItem>
                            <SelectItem value="30d">Last 30 Days</SelectItem>
                            <SelectItem value="all">All Time</SelectItem>
                        </SelectContent>
                    </Select>

                    <Button variant="outline" size="icon" onClick={() => fetchAnalytics()} disabled={loading}>
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                    </Button>

                    <Button variant="outline" size="icon">
                        <Download className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="trading" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="trading">Trading</TabsTrigger>
                    <TabsTrigger value="users">Users</TabsTrigger>
                    <TabsTrigger value="financial">Financial</TabsTrigger>
                    <TabsTrigger value="risk">Risk</TabsTrigger>
                    <TabsTrigger value="quality">Market Quality</TabsTrigger>
                </TabsList>

                {/* TRADING TAB */}
                <TabsContent value="trading" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Total Volume"
                            value={`$${tradingData?.summary?.total_volume?.toLocaleString() || '0'}`}
                            trend="up"
                            trendValue="+12.5%"
                        />
                        <MetricCard
                            title="Trade Count"
                            value={tradingData?.summary?.total_trades?.toLocaleString() || '0'}
                            trend="up"
                            trendValue="+5.2%"
                        />
                        <MetricCard
                            title="Active Traders"
                            value={tradingData?.series?.[tradingData.series.length - 1]?.active_traders || '0'}
                            trend="neutral"
                            trendValue="0%"
                        />
                        <MetricCard
                            title="Avg Trade Size"
                            value={`$${tradingData?.summary?.avg_volume?.toFixed(2) || '0'}`}
                        />
                    </div>

                    <div className="grid gap-4 md:grid-cols-7">
                        <Card className="col-span-4">
                            <CardHeader>
                                <CardTitle>Volume Overview</CardTitle>
                                <CardDescription>Trading volume over time</CardDescription>
                            </CardHeader>
                            <CardContent className="pl-2">
                                <VolumeChart data={tradingData?.series || []} />
                            </CardContent>
                        </Card>

                        <Card className="col-span-3">
                            <CardHeader>
                                <CardTitle>Open Interest Breakdown</CardTitle>
                                <CardDescription>By Market Category</CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                                    Pie Chart Placeholder
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* USERS TAB */}
                <TabsContent value="users" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="New Users"
                            value={userData?.summary?.new_users || '0'}
                            trend="up"
                        />
                        <MetricCard
                            title="Active Today"
                            value={userData?.summary?.active_traders || '0'}
                        />
                    </div>
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>User Growth</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <UserGrowthChart data={userData?.series || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* FINANCIAL TAB */}
                <TabsContent value="financial" className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                        <MetricCard
                            title="Gross Revenue"
                            value={`$${financialData?.summary?.gross_revenue?.toLocaleString() || '0'}`}
                        />
                        <MetricCard
                            title="Net Revenue"
                            value={`$${financialData?.summary?.net_revenue?.toLocaleString() || '0'}`}
                        />
                    </div>
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Revenue Trends</CardTitle>
                        </CardHeader>
                        <CardContent className="pl-2">
                            <RevenueChart data={financialData?.series || []} />
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* RISK TAB */}
                <TabsContent value="risk" className="space-y-4">
                    <Card className="col-span-4">
                        <CardHeader>
                            <CardTitle>Risk Concentration Heatmap</CardTitle>
                            <CardDescription>User Risk Score vs Position Size vs Leverage</CardDescription>
                        </CardHeader>
                        <CardContent className="pl-2">
                            {/* Mock data for visualization if real data is empty */}
                            <RiskHeatmap data={riskData?.series || [
                                { risk_score: 20, position_size: 1000, leverage: 1 },
                                { risk_score: 50, position_size: 5000, leverage: 5 },
                                { risk_score: 80, position_size: 2000, leverage: 20 },
                                { risk_score: 90, position_size: 10000, leverage: 50 },
                                { risk_score: 10, position_size: 500, leverage: 1 }
                            ]} />
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>
        </div>
    );
}
