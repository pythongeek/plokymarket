'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Shield,
  Plus,
  CheckCircle2,
  XCircle,
  TrendingUp,
  BarChart3,
  Wallet,
  AlertCircle,
  ArrowRight,
} from 'lucide-react';
import { format } from 'date-fns';

function AdminMarketCard({ market }: { market: any }) {
  const { resolveMarket } = useStore();
  const [isResolving, setIsResolving] = useState(false);

  const handleResolve = async (outcome: 'YES' | 'NO') => {
    if (!confirm(`Are you sure you want to resolve this market as ${outcome}?`)) {
      return;
    }

    setIsResolving(true);
    await resolveMarket(market.id, outcome);
    setIsResolving(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{market.category}</Badge>
              {market.status === 'active' ? (
                <Badge className="bg-green-500">Active</Badge>
              ) : (
                <Badge className="bg-purple-500">Resolved</Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg">{market.question}</h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span>Volume: ৳{market.total_volume.toLocaleString()}</span>
              <span>YES: ৳{market.yes_price?.toFixed(2)}</span>
              <span>NO: ৳{market.no_price?.toFixed(2)}</span>
              <span>Closes: {format(new Date(market.trading_closes_at), 'MMM d, yyyy')}</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {market.status === 'active' ? (
              <>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-green-500/10 text-green-500 hover:bg-green-500/20 hover:text-green-600"
                  onClick={() => handleResolve('YES')}
                  disabled={isResolving}
                >
                  <CheckCircle2 className="h-4 w-4 mr-1" />
                  Resolve YES
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
                  onClick={() => handleResolve('NO')}
                  disabled={isResolving}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Resolve NO
                </Button>
              </>
            ) : (
              <Badge className={market.winning_outcome === 'YES' ? 'bg-green-500' : 'bg-red-500'}>
                Resolved: {market.winning_outcome}
              </Badge>
            )}
            <Link href={`/markets/${market.id}`}>
              <Button size="sm" variant="ghost">
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { currentUser, isAuthenticated, markets, createMarket } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: '',
    source_url: '',
    image_url: '',
    trading_closes_at: '',
    event_date: '',
    resolution_source: '',
  });
  const [isCreating, setIsCreating] = useState(false);

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Login Required</h2>
        <p className="text-muted-foreground mb-6">Please login to access the admin panel</p>
        <Link href="/login">
          <Button>Login</Button>
        </Link>
      </div>
    );
  }

  if (!currentUser?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">Access Denied</h2>
        <p className="text-muted-foreground mb-6">You do not have permission to access the admin panel</p>
        <Link href="/markets">
          <Button>Browse Markets</Button>
        </Link>
      </div>
    );
  }

  // Stats
  const activeMarkets = markets.filter((m) => m.status === 'active').length;
  const resolvedMarkets = markets.filter((m) => m.status === 'resolved').length;
  const totalVolume = markets.reduce((sum, m) => sum + m.total_volume, 0);

  const handleCreateMarket = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);

    const success = await createMarket({
      ...formData,
      trading_closes_at: new Date(formData.trading_closes_at).toISOString(),
      event_date: new Date(formData.event_date).toISOString(),
    });

    if (success) {
      setShowCreateForm(false);
      setFormData({
        question: '',
        description: '',
        category: '',
        source_url: '',
        image_url: '',
        trading_closes_at: '',
        event_date: '',
        resolution_source: '',
      });
    }

    setIsCreating(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Badge variant="default" className="bg-purple-500">
              <Shield className="h-3 w-3 mr-1" />
              Admin
            </Badge>
          </div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground">Manage markets and platform settings</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          Create Market
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Markets</p>
                <p className="text-2xl font-bold">{markets.length}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <BarChart3 className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active</p>
                <p className="text-2xl font-bold text-green-500">{activeMarkets}</p>
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
                <p className="text-sm text-muted-foreground">Resolved</p>
                <p className="text-2xl font-bold text-purple-500">{resolvedMarkets}</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-purple-500/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-purple-500" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Volume</p>
                <p className="text-2xl font-bold">৳{(totalVolume / 1000000).toFixed(1)}M</p>
              </div>
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-5 w-5 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Create Market Form */}
      {showCreateForm && (
        <Card>
          <CardHeader>
            <CardTitle>Create New Market</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMarket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">Market Question *</Label>
                <Textarea
                  id="question"
                  placeholder="Will Bangladesh win the T20 World Cup 2024?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the market..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <Input
                    id="category"
                    placeholder="Sports, Politics, Finance..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution_source">Resolution Source</Label>
                  <Input
                    id="resolution_source"
                    placeholder="ESPN Cricinfo, Prothom Alo..."
                    value={formData.resolution_source}
                    onChange={(e) => setFormData({ ...formData, resolution_source: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="source_url">Source URL</Label>
                  <Input
                    id="source_url"
                    type="url"
                    placeholder="https://..."
                    value={formData.source_url}
                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image_url">Image URL</Label>
                  <Input
                    id="image_url"
                    type="url"
                    placeholder="https://..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trading_closes_at">Trading Closes At *</Label>
                  <Input
                    id="trading_closes_at"
                    type="datetime-local"
                    value={formData.trading_closes_at}
                    onChange={(e) => setFormData({ ...formData, trading_closes_at: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">Event Date *</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? 'Creating...' : 'Create Market'}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Markets List */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">Active ({activeMarkets})</TabsTrigger>
          <TabsTrigger value="resolved">Resolved ({resolvedMarkets})</TabsTrigger>
          <TabsTrigger value="all">All ({markets.length})</TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {markets
            .filter((m) => m.status === 'active')
            .map((market) => (
              <AdminMarketCard key={market.id} market={market} />
            ))}
        </TabsContent>

        <TabsContent value="resolved" className="space-y-4">
          {markets
            .filter((m) => m.status === 'resolved')
            .map((market) => (
              <AdminMarketCard key={market.id} market={market} />
            ))}
        </TabsContent>

        <TabsContent value="all" className="space-y-4">
          {markets.map((market) => (
            <AdminMarketCard key={market.id} market={market} />
          ))}
        </TabsContent>
      </Tabs>
    </div>
  );
}
