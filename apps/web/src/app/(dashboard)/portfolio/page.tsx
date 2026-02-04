'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

function PositionCard({ position }: { position: any }) {
  const market = position.market;
  const currentPrice = position.outcome === 'YES' ? market?.yes_price : market?.no_price;
  const currentValue = position.quantity * (currentPrice || position.average_price);
  const investedValue = position.quantity * position.average_price;
  const pnl = currentValue - investedValue;
  const pnlPercentage = (pnl / investedValue) * 100;

  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge
                variant={position.outcome === 'YES' ? 'default' : 'destructive'}
                className={position.outcome === 'YES' ? 'bg-green-500' : ''}
              >
                {position.outcome === 'YES' ? (
                  <TrendingUp className="h-3 w-3 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 mr-1" />
                )}
                {position.outcome}
              </Badge>
              <Badge variant="secondary">{market?.category}</Badge>
            </div>
            <h3 className="font-semibold text-lg mb-1">{market?.question}</h3>
            <p className="text-sm text-muted-foreground">
              {position.quantity.toLocaleString()} shares @ ৳{position.average_price.toFixed(2)} avg
            </p>
          </div>

          <div className="grid grid-cols-3 gap-6 text-right">
            <div>
              <p className="text-sm text-muted-foreground">Invested</p>
              <p className="font-semibold">৳{investedValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Current Value</p>
              <p className="font-semibold">৳{currentValue.toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">P&L</p>
              <p className={cn('font-semibold', pnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                {pnl >= 0 ? '+' : ''}৳{pnl.toLocaleString()}
                <span className="text-xs ml-1">
                  ({pnlPercentage >= 0 ? '+' : ''}{pnlPercentage.toFixed(1)}%)
                </span>
              </p>
            </div>
          </div>

          <Link href={`/markets/${market?.id}`}>
            <Button variant="outline" size="sm">
              Trade
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

function EmptyPositionsState() {
  return (
    <Card>
      <CardContent className="p-12 text-center">
        <div className="flex justify-center mb-4">
          <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
            <PieChart className="h-8 w-8 text-muted-foreground" />
          </div>
        </div>
        <h3 className="text-lg font-semibold mb-2">No positions yet</h3>
        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
          Start trading on prediction markets to build your portfolio. Browse active markets and
          place your first order.
        </p>
        <Link href="/markets">
          <Button>
            <TrendingUp className="h-4 w-4 mr-2" />
            Browse Markets
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

export default function PortfolioPage() {
  const { isAuthenticated, positions, fetchPositions } = useStore();

  useEffect(() => {
    if (isAuthenticated) {
      fetchPositions();
    }
  }, [isAuthenticated, fetchPositions]);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">Please login to view your portfolio</p>
        <div className="flex gap-4">
          <Link href="/login">
            <Button variant="outline">Login</Button>
          </Link>
          <Link href="/register">
            <Button>Get Started</Button>
          </Link>
        </div>
      </div>
    );
  }

  // Calculate portfolio stats
  const totalPositions = positions.length;
  const yesPositions = positions.filter((p) => p.outcome === 'YES');
  const noPositions = positions.filter((p) => p.outcome === 'NO');

  const totalInvested = positions.reduce((sum, p) => sum + p.quantity * p.average_price, 0);

  const potentialReturn = positions.reduce((sum, p) => sum + p.quantity * 1, 0);

  const unrealizedPnl = potentialReturn - totalInvested;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold">Portfolio</h1>
        <p className="text-muted-foreground">Track your positions and performance</p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold">৳{totalInvested.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Potential Return</p>
                <p className="text-2xl font-bold">৳{potentialReturn.toLocaleString()}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center">
                <TrendingUp className="h-5 w-5 text-green-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Unrealized P&L</p>
                <p className={cn('text-2xl font-bold', unrealizedPnl >= 0 ? 'text-green-500' : 'text-red-500')}>
                  {unrealizedPnl >= 0 ? '+' : ''}৳{unrealizedPnl.toLocaleString()}
                </p>
              </div>
              <div
                className={cn(
                  'h-10 w-10 rounded-full flex items-center justify-center',
                  unrealizedPnl >= 0 ? 'bg-green-500/10' : 'bg-red-500/10'
                )}
              >
                {unrealizedPnl >= 0 ? (
                  <ArrowUpRight className="h-5 w-5 text-green-500" />
                ) : (
                  <ArrowDownRight className="h-5 w-5 text-red-500" />
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Positions</p>
                <p className="text-2xl font-bold">{totalPositions}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <PieChart className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Positions Tabs */}
      <Tabs defaultValue="all">
        <TabsList>
          <TabsTrigger value="all">
            All Positions ({positions.length})
          </TabsTrigger>
          <TabsTrigger value="yes">
            <TrendingUp className="h-4 w-4 mr-1" />
            YES ({yesPositions.length})
          </TabsTrigger>
          <TabsTrigger value="no">
            <TrendingDown className="h-4 w-4 mr-1" />
            NO ({noPositions.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-4">
          {positions.length > 0 ? (
            positions.map((position) => <PositionCard key={position.id} position={position} />)
          ) : (
            <EmptyPositionsState />
          )}
        </TabsContent>

        <TabsContent value="yes" className="space-y-4">
          {yesPositions.length > 0 ? (
            yesPositions.map((position) => <PositionCard key={position.id} position={position} />)
          ) : (
            <EmptyPositionsState />
          )}
        </TabsContent>

        <TabsContent value="no" className="space-y-4">
          {noPositions.length > 0 ? (
            noPositions.map((position) => <PositionCard key={position.id} position={position} />)
          ) : (
            <EmptyPositionsState />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
