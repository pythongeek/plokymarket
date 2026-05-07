'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/use-toast';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { BookOpen, XCircle, TrendingUp } from 'lucide-react';

interface Market {
  id: string;
  question: string;
  total_volume: number;
  current_price_yes: number;
  status: string;
}

interface OrderBookEntry {
  price: number;
  total_qty: number;
  order_count: number;
  outcome: string;
}

export default function OrderbookPage() {
  const [markets, setMarkets] = useState<Market[]>([]);
  const [selectedMarket, setSelectedMarket] = useState('');
  const [bids, setBids] = useState<OrderBookEntry[]>([]);
  const [asks, setAsks] = useState<OrderBookEntry[]>([]);
  const [marketInfo, setMarketInfo] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchMarkets = async () => {
    const res = await fetch('/api/admin/orderbook');
    const data = await res.json();
    setMarkets(data.markets || []);
    setLoading(false);
  };

  const fetchOrderbook = async (marketId: string) => {
    setLoading(true);
    const res = await fetch(`/api/admin/orderbook?marketId=${marketId}`);
    const data = await res.json();
    setBids(data.bids || []);
    setAsks(data.asks || []);
    setMarketInfo(data.market);
    setLoading(false);
  };

  useEffect(() => { fetchMarkets(); }, []);
  useEffect(() => { if (selectedMarket) fetchOrderbook(selectedMarket); }, [selectedMarket]);

  const cancelOrder = async (orderId: string) => {
    // Find the order in bids/asks and cancel
    toast({ title: 'Cancel order', description: 'Feature requires individual order IDs' });
  };

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-slate-100 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <BookOpen className="w-6 h-6 text-cyan-400" />
          <h1 className="text-2xl font-bold">Live Order Book Monitor</h1>
        </div>

        <Select value={selectedMarket} onValueChange={setSelectedMarket}>
          <SelectTrigger className="w-[400px] bg-slate-900/60 border-slate-700 text-slate-100 mb-6">
            <SelectValue placeholder="Select a market..." />
          </SelectTrigger>
          <SelectContent className="bg-[#0f1629] border-slate-700">
            {markets.map(m => (
              <SelectItem key={m.id} value={m.id}>{m.question?.slice(0, 60)}...</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {marketInfo && (
          <div className="grid grid-cols-4 gap-4 mb-6">
            <Card className="bg-[#0f1629] border-slate-800"><CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase">Price Yes</p>
              <p className="text-xl font-bold text-emerald-400">${marketInfo.current_price_yes?.toFixed(2) || '0.00'}</p>
            </CardContent></Card>
            <Card className="bg-[#0f1629] border-slate-800"><CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase">Volume</p>
              <p className="text-xl font-bold text-blue-400">${(marketInfo.total_volume || 0).toLocaleString()}</p>
            </CardContent></Card>
            <Card className="bg-[#0f1629] border-slate-800"><CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase">Liquidity</p>
              <p className="text-xl font-bold text-amber-400">${(marketInfo.liquidity || 0).toLocaleString()}</p>
            </CardContent></Card>
            <Card className="bg-[#0f1629] border-slate-800"><CardContent className="p-4">
              <p className="text-slate-400 text-xs uppercase">Traders</p>
              <p className="text-xl font-bold text-purple-400">{marketInfo.trader_count || 0}</p>
            </CardContent></Card>
          </div>
        )}

        <div className="grid grid-cols-2 gap-6">
          <Card className="bg-[#0f1629] border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-emerald-400 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4" /> Bids (Buy)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Price</TableHead>
                  <TableHead className="text-slate-400">Quantity</TableHead>
                  <TableHead className="text-slate-400">Orders</TableHead>
                  <TableHead className="text-slate-400">Outcome</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {bids.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-4 text-slate-500">No bids</TableCell></TableRow> :
                    bids.map((b, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="text-emerald-400 font-mono">${b.price?.toFixed(4)}</TableCell>
                        <TableCell className="text-slate-300">{b.total_qty?.toFixed(0)}</TableCell>
                        <TableCell className="text-slate-400">{b.order_count}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs border-slate-700">{b.outcome}</Badge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card className="bg-[#0f1629] border-slate-800">
            <CardHeader className="pb-2"><CardTitle className="text-red-400 text-sm flex items-center gap-2"><TrendingUp className="w-4 h-4 rotate-180" /> Asks (Sell)</CardTitle></CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader><TableRow className="border-slate-800">
                  <TableHead className="text-slate-400">Price</TableHead>
                  <TableHead className="text-slate-400">Quantity</TableHead>
                  <TableHead className="text-slate-400">Orders</TableHead>
                  <TableHead className="text-slate-400">Outcome</TableHead>
                </TableRow></TableHeader>
                <TableBody>
                  {asks.length === 0 ? <TableRow><TableCell colSpan={4} className="text-center py-4 text-slate-500">No asks</TableCell></TableRow> :
                    asks.map((a, i) => (
                      <TableRow key={i} className="border-slate-800 hover:bg-slate-800/50">
                        <TableCell className="text-red-400 font-mono">${a.price?.toFixed(4)}</TableCell>
                        <TableCell className="text-slate-300">{a.total_qty?.toFixed(0)}</TableCell>
                        <TableCell className="text-slate-400">{a.order_count}</TableCell>
                        <TableCell><Badge variant="outline" className="text-xs border-slate-700">{a.outcome}</Badge></TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
