'use client';

import {
    AreaChart,
    Area,
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
    // Basic logic to determine ROI or trend for color
    // In a real scenario, this would be passed down or calculated properly
    // For now we will look at the first and last volume and mock an "ROI"
    const startVol = data.length > 0 ? (data[0].volume || 1) : 1;
    const endVol = data.length > 0 ? (data[data.length - 1].volume || 0) : 0;
    const roi = ((endVol - startVol) / startVol) * 100;

    let color = '#8884d8'; // Default
    if (roi > 20) color = '#10b981'; // Green
    else if (roi >= -10 && roi <= 20) color = '#f59e0b'; // Amber
    else color = '#ef4444'; // Red

    return (
        <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data}>
                <defs>
                    <linearGradient id="colorVolume" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={color} stopOpacity={0.8} />
                        <stop offset="95%" stopColor={color} stopOpacity={0} />
                    </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    dataKey="time"
                    tickFormatter={(time) => new Date(time).toLocaleDateString()}
                    className="text-xs text-muted-foreground"
                />
                <YAxis
                    tickFormatter={(value: number) => `৳${value.toLocaleString()}`}
                    className="text-xs text-muted-foreground"
                />
                <Tooltip
                    contentStyle={{ backgroundColor: 'hsl(var(--card))', borderColor: 'hsl(var(--border))' }}
                    formatter={(value: number) => `৳${value.toLocaleString()}`}
                    labelFormatter={(label) => `Date: ${new Date(label).toLocaleDateString()}`}
                />
                <Area
                    type="monotone"
                    dataKey="volume"
                    stroke={color}
                    fillOpacity={1}
                    fill="url(#colorVolume)"
                />
            </AreaChart>
        </ResponsiveContainer>
    );
}
