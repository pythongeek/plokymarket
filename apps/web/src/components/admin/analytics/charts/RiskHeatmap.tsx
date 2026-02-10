'use client';

import {
    ScatterChart,
    Scatter,
    XAxis,
    YAxis,
    ZAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend
} from 'recharts';

interface RiskHeatmapProps {
    data: any[];
}

export function RiskHeatmap({ data }: RiskHeatmapProps) {
    // Example data structure: { user_id, risk_score, position_size, leverage }
    return (
        <ResponsiveContainer width="100%" height={300}>
            <ScatterChart>
                <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                <XAxis
                    type="number"
                    dataKey="risk_score"
                    name="Risk Score"
                    domain={[0, 100]}
                    className="text-xs text-muted-foreground"
                />
                <YAxis
                    type="number"
                    dataKey="position_size"
                    name="Position Size ($)"
                    unit="$"
                    className="text-xs text-muted-foreground"
                />
                <ZAxis
                    type="number"
                    dataKey="leverage"
                    range={[64, 144]}
                    name="Leverage"
                />
                <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                <Legend />
                <Scatter name="User Positions" data={data} fill="#ff7300" />
            </ScatterChart>
        </ResponsiveContainer>
    );
}
