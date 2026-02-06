'use client';

import { supabase } from '@/lib/supabase';

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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useTranslation } from 'react-i18next';

function AdminMarketCard({ market }: { market: any }) {
  const { resolveMarket } = useStore();
  const [isResolving, setIsResolving] = useState(false);
  const { t } = useTranslation();

  const handleResolve = async (outcome: 'YES' | 'NO') => {
    if (!confirm(t('admin.resolve_confirm', { outcome }))) {
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
                <Badge className="bg-green-500">{t('admin.active_badge')}</Badge>
              ) : (
                <Badge className="bg-purple-500">{t('admin.resolved_badge')}</Badge>
              )}
            </div>
            <h3 className="font-semibold text-lg">{market.question}</h3>
            <div className="flex flex-wrap gap-4 mt-2 text-sm text-muted-foreground">
              <span>{t('admin.volume')}: ৳{market.total_volume.toLocaleString()}</span>
              <span>YES: ৳{market.yes_price?.toFixed(2)}</span>
              <span>NO: ৳{market.no_price?.toFixed(2)}</span>
              <span>{t('admin.closes')}: {format(new Date(market.trading_closes_at), 'MMM d, yyyy')}</span>
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
                  {t('admin.resolve_yes')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="bg-red-500/10 text-red-500 hover:bg-red-500/20 hover:text-red-600"
                  onClick={() => handleResolve('NO')}
                  disabled={isResolving}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  {t('admin.resolve_no')}
                </Button>
              </>
            ) : (
              <Badge className={market.winning_outcome === 'YES' ? 'bg-green-500' : 'bg-red-500'}>
                {t('admin.resolved_badge')}: {market.winning_outcome}
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

function AdminSuggestionCard({ suggestion, onApprove }: { suggestion: any, onApprove: (s: any) => void }) {
  const { updateSuggestion } = useStore();
  const [isUpdating, setIsUpdating] = useState(false);
  const { t } = useTranslation();

  const handleAction = async (status: 'approved' | 'rejected') => {
    setIsUpdating(true);
    await updateSuggestion(suggestion.id, status);
    if (status === 'approved') {
      onApprove(suggestion);
    }
    setIsUpdating(false);
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="outline">{suggestion.status}</Badge>
              <Badge variant="secondary" className="bg-blue-500/10 text-blue-500">
                {t('admin.confidence')}: {(suggestion.ai_confidence * 100).toFixed(0)}%
              </Badge>
            </div>
            <h3 className="font-semibold text-lg">{suggestion.title}</h3>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{suggestion.description}</p>
            {suggestion.source_url && (
              <a
                href={suggestion.source_url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-primary hover:underline mt-2 block"
              >
                {t('admin.source')}: {suggestion.source_url}
              </a>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="default"
              onClick={() => handleAction('approved')}
              disabled={isUpdating || suggestion.status === 'approved'}
            >
              {t('admin.approve_create')}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleAction('rejected')}
              disabled={isUpdating || suggestion.status === 'rejected'}
            >
              {t('admin.reject')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdminPage() {
  const { currentUser, isAuthenticated, markets, createMarket, suggestions, fetchSuggestions } = useStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const { t } = useTranslation();

  // Form state
  // ... (rest of state items are unchanged below)

  const [formData, setFormData] = useState({
    question: '',
    description: '',
    category: '',
    source_url: '',
    image_url: '',
    trading_closes_at: '',
    event_date: '',
    resolution_source: '',
    resolution_source_type: 'MANUAL',
    uma_bond: '100',
    ai_context: '',
    initial_liquidity: '1000',
    fee_percent: '2.0',
    maker_rebate_percent: '0.05',
  });
  const [isCreating, setIsCreating] = useState(false);

  // Fetch suggestions on load
  useState(() => {
    if (isAuthenticated && currentUser?.is_admin && !isLoaded) {
      fetchSuggestions();
      setIsLoaded(true);
    }
  });

  const handleApproveSuggestion = (suggestion: any) => {
    setFormData({
      ...formData,
      question: suggestion.title,
      description: suggestion.description || '',
      source_url: suggestion.source_url || '',
      resolution_source: suggestion.source_url ? new URL(suggestion.source_url).hostname : '',
    });
    setShowCreateForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('admin.login_required')}</h2>
        <p className="text-muted-foreground mb-6">{t('admin.login_desc')}</p>
        <Link href="/login">
          <Button>{t('common.login')}</Button>
        </Link>
      </div>
    );
  }

  if (!currentUser?.is_admin) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Shield className="h-16 w-16 text-red-500 mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('admin.access_denied')}</h2>
        <p className="text-muted-foreground mb-6">{t('admin.access_denied_desc')}</p>
        <Link href="/markets">
          <Button>{t('admin.browse_markets')}</Button>
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
      resolution_source_type: formData.resolution_source_type,
      resolution_data: {
        uma_bond: formData.uma_bond,
        ai_evidence: formData.ai_context,
        initial_liquidity: parseFloat(formData.initial_liquidity),
        fee_percent: parseFloat(formData.fee_percent),
        maker_rebate_percent: parseFloat(formData.maker_rebate_percent),
      } as any
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
        resolution_source_type: 'MANUAL',
        uma_bond: '100',
        ai_context: '',
        initial_liquidity: '1000',
        fee_percent: '2.0',
        maker_rebate_percent: '0.05',
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
          <h1 className="text-3xl font-bold">{t('admin.page_title')}</h1>
          <p className="text-muted-foreground">{t('admin.page_subtitle')}</p>
        </div>
        <Button onClick={() => setShowCreateForm(!showCreateForm)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin.create_market')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin.total_markets')}</p>
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
                <p className="text-sm text-muted-foreground">{t('admin.active')}</p>
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
                <p className="text-sm text-muted-foreground">{t('admin.resolved')}</p>
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
                <p className="text-sm text-muted-foreground">{t('admin.total_volume')}</p>
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
            <CardTitle>{t('admin.form.title')}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreateMarket} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="question">{t('admin.form.question')}</Label>
                <Textarea
                  id="question"
                  placeholder="Will Bangladesh win the T20 World Cup 2024?"
                  value={formData.question}
                  onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">{t('admin.form.description')}</Label>
                <Textarea
                  id="description"
                  placeholder="Detailed description of the market..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">{t('admin.form.category')}</Label>
                  <Input
                    id="category"
                    placeholder="Sports, Politics, Finance..."
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="resolution_source">{t('admin.form.resolution_source')}</Label>
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
                  <Label htmlFor="source_url">{t('admin.form.source_url')}</Label>
                  <Input
                    id="source_url"
                    type="url"
                    placeholder="https://..."
                    value={formData.source_url}
                    onChange={(e) => setFormData({ ...formData, source_url: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="image">{t('admin.form.image')}</Label>
                  <div className="flex gap-2 items-center">
                    <Input
                      id="image"
                      type="file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        // Upload logic
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${Math.random()}.${fileExt}`;
                        const filePath = `${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from('market-images')
                          .upload(filePath, file);

                        if (uploadError) {
                          alert('Error uploading image: ' + uploadError.message);
                          return;
                        }

                        const { data: { publicUrl } } = supabase.storage
                          .from('market-images')
                          .getPublicUrl(filePath);

                        setFormData({ ...formData, image_url: publicUrl });
                      }}
                    />
                    {formData.image_url && (
                      <div className="h-10 w-10 relative rounded overflow-hidden border">
                        <img src={formData.image_url} alt="Preview" className="object-cover w-full h-full" />
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('admin.form.upload_hint')}</p>
                  <Input
                    type="url"
                    placeholder="Or paste image URL..."
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="mt-2"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="trading_closes_at">{t('admin.form.trading_closes')}</Label>
                  <Input
                    id="trading_closes_at"
                    type="datetime-local"
                    value={formData.trading_closes_at}
                    onChange={(e) => setFormData({ ...formData, trading_closes_at: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="event_date">{t('admin.form.event_date')}</Label>
                  <Input
                    id="event_date"
                    type="datetime-local"
                    value={formData.event_date}
                    onChange={(e) => setFormData({ ...formData, event_date: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-primary/5 rounded-xl border border-primary/10">
                <div className="space-y-2">
                  <Label htmlFor="initial_liquidity">Initial Liquidity (৳)</Label>
                  <Input
                    id="initial_liquidity"
                    type="number"
                    value={formData.initial_liquidity}
                    onChange={(e) => setFormData({ ...formData, initial_liquidity: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="fee_percent">Platform Fee (%)</Label>
                  <Input
                    id="fee_percent"
                    type="number"
                    step="0.01"
                    value={formData.fee_percent}
                    onChange={(e) => setFormData({ ...formData, fee_percent: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maker_rebate_percent">Maker Rebate (%)</Label>
                  <Input
                    id="maker_rebate_percent"
                    type="number"
                    step="0.01"
                    value={formData.maker_rebate_percent}
                    onChange={(e) => setFormData({ ...formData, maker_rebate_percent: e.target.value })}
                  />
                </div>
              </div>

              {/* Resolution Strategy Optimization */}
              <div className="space-y-4 pt-4 border-t">
                <div className="space-y-2">
                  <Label>{t('admin.form.resolution_strategy')}</Label>
                  <Select
                    value={formData.resolution_source_type}
                    onValueChange={(value) => setFormData({ ...formData, resolution_source_type: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin.form.select_strategy')} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MANUAL">{t('admin.strategies.manual')}</SelectItem>
                      <SelectItem value="AI">{t('admin.strategies.ai')}</SelectItem>
                      <SelectItem value="UMA">{t('admin.strategies.uma')}</SelectItem>
                      <SelectItem value="CENTRALIZED">{t('admin.strategies.centralized')}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {formData.resolution_source_type === 'UMA' && (
                  <div className="space-y-2">
                    <Label htmlFor="uma_bond">{t('admin.form.uma_bond')}</Label>
                    <Input
                      id="uma_bond"
                      type="number"
                      value={formData.uma_bond}
                      onChange={(e) => setFormData({ ...formData, uma_bond: e.target.value })}
                    />
                  </div>
                )}

                {formData.resolution_source_type === 'AI' && (
                  <div className="space-y-2">
                    <Label htmlFor="ai_context">{t('admin.form.ai_context')}</Label>
                    <Textarea
                      id="ai_context"
                      placeholder={t('admin.form.ai_context_placeholder')}
                      value={formData.ai_context}
                      onChange={(e) => setFormData({ ...formData, ai_context: e.target.value })}
                    />
                  </div>
                )}

                {formData.resolution_source_type === 'CENTRALIZED' && (
                  <p className="text-xs text-muted-foreground italic">
                    {t('admin.form.multisig_hint')}
                  </p>
                )}
              </div>

              <div className="flex gap-2">
                <Button type="submit" disabled={isCreating}>
                  {isCreating ? t('admin.form.creating') : t('admin.form.create')}
                </Button>
                <Button type="button" variant="outline" onClick={() => setShowCreateForm(false)}>
                  {t('admin.form.cancel')}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Markets List */}
      <Tabs defaultValue="active">
        <TabsList>
          <TabsTrigger value="active">{t('admin.active')} ({activeMarkets})</TabsTrigger>
          <TabsTrigger value="resolved">{t('admin.resolved')} ({resolvedMarkets})</TabsTrigger>
          <TabsTrigger value="suggestions">{t('admin.suggestions_tab')} ({suggestions.filter(s => s.status === 'pending').length})</TabsTrigger>
          <TabsTrigger value="all">{t('common.all')} ({markets.length})</TabsTrigger>
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

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length === 0 ? (
            <div className="text-center py-10 text-muted-foreground">
              {t('admin.no_suggestions')}
            </div>
          ) : (
            suggestions
              .filter((s) => s.status === 'pending')
              .map((suggestion) => (
                <AdminSuggestionCard
                  key={suggestion.id}
                  suggestion={suggestion}
                  onApprove={handleApproveSuggestion}
                />
              ))
          )}
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
