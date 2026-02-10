'use client';

import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer
} from 'recharts';

interface VolumeChartProps {
    data: any[];
}

export function VolumeChart({ data }: VolumeChartProps) {
    return (
        <ResponsiveContainer width="100%" height={300}>
            <BarChart data={data}>
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
                />
                <Bar dataKey="volume" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
        </ResponsiveContainer>
    );
}
