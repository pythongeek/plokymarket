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
            const size = Number(o.totalQuantity);
            cumulative += size;
            return {
                price: Number(o.price) / 1000000,
                [type]: cumulative,
                size: size // for tooltip
            };
        });
    };

    const bidData = processData([...bids].reverse(), 'bid'); // Reverse bids so low->high price
    const askData = processData(asks, 'ask');

    // Combine:
    const data = [...bidData, ...askData].sort((a, b) => a.price - b.price);

    return (
        <div className="h-48 w-full bg-background mt-2">
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
                    <XAxis dataKey="price" hide />
                    <YAxis hide />
                    <Tooltip
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.8)', border: 'none', borderRadius: '4px', fontSize: '10px' }}
                        itemStyle={{ color: '#fff' }}
                    />
                    <Area type="stepAfter" dataKey="bid" stroke="#10B981" fillOpacity={1} fill="url(#colorBid)" />
                    <Area type="stepAfter" dataKey="ask" stroke="#EF4444" fillOpacity={1} fill="url(#colorAsk)" />
                </AreaChart>
            </ResponsiveContainer>
        </div>
    );
};
