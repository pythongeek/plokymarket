'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Loader2, Droplets, Plus, TrendingUp, Users } from 'lucide-react';

interface LiquidityPool {
  id: string;
  market_id: string;
  name: string;
  current_liquidity: number;
  initial_liquidity: number;
  total_shares: number;
  fee_rate: number;
  status: string;
  created_at: string;
  market_question?: string;
}

export default function LiquidityPoolsPage() {
  const [pools, setPools] = useState<LiquidityPool[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    market_id: '',
    initial_liquidity: 1000,
    fee_rate: 0.002,
  });

  useEffect(() => {
    fetchPools();
  }, []);

  const fetchPools = async () => {
    try {
      const res = await fetch('/api/admin/liquidity-pools', { credentials: 'include' });
      if (!res.ok) throw new Error('Failed to fetch pools');
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setPools(data.pools || []);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const createPool = async () => {
    if (!form.market_id.trim()) {
      toast({ title: 'Error', description: 'Market ID is required', variant: 'destructive' });
      return;
    }
    setCreating(true);
    try {
      const res = await fetch('/api/admin/liquidity-pools', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok || data.error) {
        throw new Error(data.error || 'Failed to create pool');
      }
      toast({ title: 'Success', description: `Pool ${data.pool.id} created` });
      setPools((prev) => [data.pool, ...prev]);
      setDialogOpen(false);
      setForm({ market_id: '', initial_liquidity: 1000, fee_rate: 0.002 });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const totalLiquidity = pools.reduce((sum, p) => sum + (p.current_liquidity || 0), 0);
  const activePools = pools.filter((p) => p.status === 'active').length;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-2">
            <Droplets className="w-8 h-8 text-primary" />
            Liquidity Pools
          </h1>
          <p className="text-slate-400 mt-2">Manage PMF liquidity pools and LP rewards</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              Create Pool
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-slate-900 border-slate-800 text-white">
            <DialogHeader>
              <DialogTitle>Create Liquidity Pool</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Market ID</Label>
                <Input
                  value={form.market_id}
                  onChange={(e) => setForm({ ...form, market_id: e.target.value })}
                  placeholder="Enter market UUID"
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div>
                <Label>Initial Liquidity (USDT)</Label>
                <Input
                  type="number"
                  value={form.initial_liquidity}
                  onChange={(e) => setForm({ ...form, initial_liquidity: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <div>
                <Label>Fee Rate (e.g., 0.002 = 0.2%)</Label>
                <Input
                  type="number"
                  step={0.001}
                  value={form.fee_rate}
                  onChange={(e) => setForm({ ...form, fee_rate: Number(e.target.value) })}
                  className="bg-slate-950 border-slate-800 text-white"
                />
              </div>
              <Button onClick={createPool} disabled={creating} className="w-full">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Create Pool'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Liquidity</CardTitle>
            <TrendingUp className="w-4 h-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">${totalLiquidity.toLocaleString()}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Active Pools</CardTitle>
            <Droplets className="w-4 h-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{activePools}</div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900 border-slate-800">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-slate-300">Total Pools</CardTitle>
            <Users className="w-4 h-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-white">{pools.length}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="bg-slate-900 border-slate-800">
        <CardHeader>
          <CardTitle className="text-white">All Pools</CardTitle>
          <CardDescription>Active and inactive liquidity pools</CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-slate-800">
                <TableHead className="text-slate-400">Pool</TableHead>
                <TableHead className="text-slate-400">Market</TableHead>
                <TableHead className="text-slate-400">Liquidity</TableHead>
                <TableHead className="text-slate-400">Fee Rate</TableHead>
                <TableHead className="text-slate-400">Status</TableHead>
                <TableHead className="text-slate-400">Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pools.map((pool) => (
                <TableRow key={pool.id} className="border-slate-800">
                  <TableCell className="font-medium text-white">{pool.name}</TableCell>
                  <TableCell className="text-slate-300 text-sm max-w-[200px] truncate">
                    {pool.market_question || pool.market_id.slice(0, 8)}
                  </TableCell>
                  <TableCell className="text-white">
                    ${pool.current_liquidity?.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-slate-300">{(pool.fee_rate * 100).toFixed(2)}%</TableCell>
                  <TableCell>
                    <Badge
                      variant={pool.status === 'active' ? 'default' : 'secondary'}
                      className={
                        pool.status === 'active'
                          ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                          : 'bg-slate-700 text-slate-400'
                      }
                    >
                      {pool.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-slate-400 text-sm">
                    {new Date(pool.created_at).toLocaleDateString()}
                  </TableCell>
                </TableRow>
              ))}
              {pools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-slate-500 py-8">
                    No liquidity pools found
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
