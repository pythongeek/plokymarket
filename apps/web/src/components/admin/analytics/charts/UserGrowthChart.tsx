'use client';

import {
    LineChart,
    Line,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface UserGrowthChartProps {
    data: any[];
}

export function UserGrowthChart({ data }: UserGrowthChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data}>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="time"
                    tickFormatter={(time) => new Date(time).toLocaleDateString()}
                    className="text-xs text-muted-foreground"
                />
                <YAxis
                    className="text-xs text-muted-foreground"
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                />
                <Legend />
                <Line
                    type="monotone"
                    dataKey="new_users"
                    name="New Users"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                />
                <Line
                    type="monotone"
                    dataKey="active_traders"
                    name="Active Traders"
                    stroke="#82ca9d"
                    strokeWidth={2}
                    dot={false}
                />
            </LineChart>
        </ResponsiveContainer>
    );
}
