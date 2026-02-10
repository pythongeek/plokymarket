'use client';

import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface RevenueChartProps {
    data: any[];
}

export function RevenueChart({ data }: RevenueChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="time"
                    tickFormatter={(time) => new Date(time).toLocaleDateString()}
                    className="text-xs text-muted-foreground"
                />
                <YAxis
                    tickFormatter={(value) => `$${value}`}
                    className="text-xs text-muted-foreground"
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    formatter={(value: any) => [`$${Number(value).toFixed(2)}`, '']}
                />
                <Legend />
                <Area
                    type="monotone"
                    dataKey="revenue"
                    name="Gross Revenue"
                    stackId="1"
                    stroke="hsl(var(--primary))"
                    fill="hsl(var(--primary))"
                    fillOpacity={0.2}
                />
                <Area
                    type="monotone"
                    dataKey="net_revenue"
                    name="Net Revenue"
                    stackId="2"
                    stroke="#8884d8"
                    fill="#8884d8"
                    fillOpacity={0.2}
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
