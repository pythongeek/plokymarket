import React from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { OrderLevel } from '@/lib/clob/types';

interface DepthChartProps {
    bids: OrderLevel[];
    asks: OrderLevel[];
}

export const DepthChart: React.FC<DepthChartProps> = ({ bids, asks }) => {
    // Transform data for chart: Needs cumulative volume
    const processData = (orders: OrderLevel[], type: 'bid' | 'ask') => {
        let cumulative = 0;
        return orders.map(o => {
            cumulative += o.size;
            return {
                price: o.price,
                [type]: cumulative,
                size: o.size // for tooltip
            };
        });
    };

    const bidData = processData([...bids].reverse(), 'bid'); // Reverse bids so low->high price
    const askData = processData(asks, 'ask'); // Asks are already low->high usually? 
    // Wait: Asks: Low price is best. Sorted Ascending. 10, 11, 12.
    // Chart X Axis is Price.
    // Bids: High price is best. Sorted Descending. 9, 8, 7.
    // We want X axis from 7 -> 12.
    // So we need Bids reversed (7, 8, 9) and Asks (10, 11, 12).

    // Combine:
    const data = [...bidData, ...askData];

    return (
        <div className="h-64 w-full bg-background p-4 rounded-lg border">
            <h3 className="text-sm font-medium mb-2 text-foreground">Market Depth</h3>
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data}>
                    <defs>
                        <linearGradient id="colorBid" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#10B981" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#10B981" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorAsk" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#EF4444" stopOpacity={0.8} />
                            <stop offset="95%" stopColor="#EF4444" stopOpacity={0} />
                        </linearGradient>
                    </defs>
                    <XAxis dataKey="price" />
                    <YAxis />
                    <Tooltip />
                    <Area type="stepAfter" dataKey="bid" stroke="#10B981" fillOpacity={1} fill="url(#colorBid)" />
                    <Area type="stepAfter" dataKey="ask" stroke="#EF4444" fillOpacity={1} fill="url(#colorAsk)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
