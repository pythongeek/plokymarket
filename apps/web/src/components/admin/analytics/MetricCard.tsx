'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ArrowDown, ArrowUp, Minus } from 'lucide-react';

interface MetricCardProps {
    title: string;
    value: string | number;
    description?: string;
    trend?: 'up' | 'down' | 'neutral';
    trendValue?: string;
    icon?: React.ReactNode;
}

export function MetricCard({
    title,
    value,
    description,
    trend,
    trendValue,
    icon
}: MetricCardProps) {
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                {icon && <div className="text-muted-foreground">{icon}</div>}
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {description && (
                    <p className="text-xs text-muted-foreground mt-1">{description}</p>
                )}
                {trendValue && (
                    <div className={`flex items-center text-xs mt-2 ${trend === 'up' ? 'text-green-500' :
                            trend === 'down' ? 'text-red-500' :
                                'text-muted-foreground'
                        }`}>
                        {trend === 'up' && <ArrowUp className="mr-1 h-3 w-3" />}
                        {trend === 'down' && <ArrowDown className="mr-1 h-3 w-3" />}
                        {trend === 'neutral' && <Minus className="mr-1 h-3 w-3" />}
                        <span className="font-medium">{trendValue}</span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
