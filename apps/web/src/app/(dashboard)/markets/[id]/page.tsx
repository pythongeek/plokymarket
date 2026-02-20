'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { OrderBook } from '@/components/clob/OrderBook';
import { DepthChart } from '@/components/clob/DepthChart';
import { LiquidityHeatMap } from '@/components/clob/LiquidityHeatMap';
import { MarketStatusDisplay } from '@/components/market/MarketStatusDisplay';
import { CommentSection } from '@/components/social/CommentSection';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { PriceChart } from '@/components/trading/PriceChart';
import { PauseBanner } from '@/components/trading/PauseBanner';
import { useMarketStore } from '@/store/marketStore';
import { Market } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import {
  ArrowLeft,
  Calendar,
  Clock,
  ExternalLink,
  BarChart3,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { bn, enUS } from 'date-fns/locale';

export default function MarketDetailPage() {
  const params = useParams() as { id?: string };
  const router = useRouter();
  const { t, i18n } = useTranslation();

  const marketId = params.id;
  const {
    markets,
    orders,
    fetchMarkets,
    fetchOrders,
  } = useStore();

  const {
    isPlatformPaused,
    categoryPauseStatus,
    subscribeToEmergencySettings,
    unsubscribeAll,
    events
  } = useMarketStore();

  useEffect(() => {
    fetchMarkets();
    if (params.id) fetchOrders(params.id);
    subscribeToEmergencySettings();
    return () => unsubscribeAll();
  }, [fetchMarkets, fetchOrders, params.id, subscribeToEmergencySettings, unsubscribeAll]);

  // Use event from marketStore if available for real-time pause updates
  const event = marketId ? events.get(marketId) : undefined;
  const market = (event as unknown as Market) || (marketId ? markets.find((m) => m.id === marketId) : undefined);

  const dateLocale = i18n.language === 'bn' ? bn : enUS;

  if (!market) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">{t('market_detail.not_found')}</h2>
        <p className="text-muted-foreground mb-6">
          {t('market_detail.not_found_desc')}
        </p>
        <Button onClick={() => router.push('/markets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('market_detail.back_to_markets')}
        </Button>
      </div>
    );
  }

  const isResolved = market.status === 'resolved';
  const isClosingSoon =
    !isResolved && new Date(market.trading_closes_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <button onClick={() => router.push('/markets')} className="hover:text-foreground transition-colors">
          {t('common.markets')}
        </button>
        <span>/</span>
        <span className="text-foreground">{market.category}</span>
      </div>

      {/* Market Header */}
      <div className="space-y-4">
        <div className="flex flex-wrap items-start gap-3">
          <Badge variant="secondary">{market.category}</Badge>
          {isResolved ? (
            <Badge className="bg-purple-500">
              <CheckCircle2 className="h-3 w-3 mr-1" />
              {t('market_detail.resolved')}
            </Badge>
          ) : isClosingSoon ? (
            <Badge variant="destructive">
              <Clock className="h-3 w-3 mr-1" />
              {t('market_detail.closing_soon')}
            </Badge>
          ) : (
            <Badge variant="default" className="bg-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              {t('market_detail.active')}
            </Badge>
          )}
        </div>

        <h1 className="text-2xl md:text-3xl font-bold">{market.question}</h1>

        {market.description && (
          <p className="text-muted-foreground max-w-3xl">{market.description}</p>
        )}

      </div>

      {/* Emergency Pause Banner */}
      {(() => {
        const categoryPause = market ? categoryPauseStatus.get(market.category) : undefined;
        const isCategoryPaused = categoryPause?.paused || false;
        const isMarketPaused = market?.trading_status === 'paused';

        if (isPlatformPaused || isCategoryPaused || isMarketPaused) {
          const level = isPlatformPaused ? 'platform' : isCategoryPaused ? 'category' : 'market';
          const reason = isPlatformPaused ? undefined : isCategoryPaused ? categoryPause?.reason : market?.pause_reason;
          const pausedAt = isPlatformPaused ? undefined : isCategoryPaused ? undefined : market?.paused_at; // Platform/Category pause times could be added if needed

          return (
            <PauseBanner
              level={level}
              reason={reason}
              pausedAt={pausedAt}
              estimatedResumeAt={market?.estimated_resume_at}
            />
          );
        }
        return null;
      })()}

      <MarketStatusDisplay
        market={market}
        oracleConfidence={market.resolution_details?.ai_confidence || 85} // Mock default if not present
        isPaused={isPlatformPaused || (market ? (categoryPauseStatus.get(market.category)?.paused || market.trading_status === 'paused') : false)}
      />

      <Separator />

      {/* Resolved State */}
      {isResolved && (
        <Card className="border-purple-500/50 bg-purple-500/5">
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-purple-500/20 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-purple-500" />
              </div>
              <div>
                <h2 className="text-xl font-bold">{t('market_detail.market_resolved')}</h2>
                <p className="text-muted-foreground">
                  {t('market_detail.resolved_to')}{' '}
                  <span
                    className={
                      market.winning_outcome === 'YES'
                        ? 'text-green-500 font-semibold'
                        : 'text-red-500 font-semibold'
                    }
                  >
                    {market.winning_outcome === 'YES' ? t('common.yes') : t('common.no')}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('market_detail.resolved_on')}{' '}
                  {market.resolved_at && format(new Date(market.resolved_at), 'MMM d, yyyy', { locale: dateLocale })}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column - Chart & Order Book */}
        <div className="lg:col-span-2 space-y-6">
          {/* Price Chart */}
          <PriceChart marketId={market.id} />

          {/* Order Book */}
          <OrderBook marketId={market.id} />

          {/* Advanced Visualizations */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{t('market_detail.depth_semantic')}</span>
                  <div className="flex gap-2 text-[10px] items-center">
                    <span className="bg-primary/10 px-2 py-0.5 rounded text-primary">{t('market_detail.range_5')}</span>
                    <span className="bg-primary/10 px-2 py-0.5 rounded text-primary">{t('market_detail.zoom_1')}</span>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DepthChart
                  bids={orders
                    .filter(o => o.market_id === market.id && o.side === 'buy' && o.status === 'open')
                    .map(o => ({
                      price: BigInt(Math.floor(o.price * 1000000)),
                      totalQuantity: BigInt(o.quantity),
                      orderCount: 1,
                      orders: null as any,
                      maxOrderId: o.id,
                      dirty: false,
                      lastModified: Date.now()
                    }))}
                  asks={orders
                    .filter(o => o.market_id === market.id && o.side === 'sell' && o.status === 'open')
                    .map(o => ({
                      price: BigInt(Math.floor(o.price * 1000000)),
                      totalQuantity: BigInt(o.quantity),
                      orderCount: 1,
                      orders: null as any,
                      maxOrderId: o.id,
                      dirty: false,
                      lastModified: Date.now()
                    }))}
                />
              </CardContent>
            </Card>

            <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-bold flex items-center justify-between">
                  <span>{t('market_detail.high_depth')}</span>
                  <div className="flex gap-4 text-[10px] font-medium">
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-blue-500" /> {t('market_detail.low_depth')}
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 rounded-full bg-orange-500" /> {t('market_detail.high_depth')}
                    </div>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LiquidityHeatMap
                  bids={orders
                    .filter(o => o.market_id === market.id && o.side === 'buy' && o.status === 'open')
                    .map(o => ({ price: o.price, size: o.quantity, total: o.quantity }))}
                  asks={orders
                    .filter(o => o.market_id === market.id && o.side === 'sell' && o.status === 'open')
                    .map(o => ({ price: o.price, size: o.quantity, total: o.quantity }))}
                  windowMinutes={5}
                />
              </CardContent>
            </Card>
          </div>

          {/* Market Details (মার্কেট বিস্তারিত) */}
          <Card className="bg-card/50 backdrop-blur-sm border-primary/10">
            <CardHeader className="border-b border-primary/5">
              <CardTitle className="text-lg font-bold text-primary">{t('market_detail.details')}</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 border-b border-primary/5">
                <div className="p-6 text-center group hover:bg-green-500/5 transition-colors">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('market_detail.yes_price')}</div>
                  <div className="text-3xl font-black text-green-500">
                    ৳{market.yes_price?.toFixed(2) || '0.50'}
                  </div>
                </div>
                <div className="p-6 text-center group hover:bg-red-500/5 transition-colors">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('market_detail.no_price')}</div>
                  <div className="text-3xl font-black text-red-500">
                    ৳{market.no_price?.toFixed(2) || '0.50'}
                  </div>
                </div>
                <div className="p-6 text-center group hover:bg-primary/5 transition-colors">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('market_detail.yes_shares')}</div>
                  <div className="text-3xl font-black text-foreground">
                    {market.yes_shares_outstanding || 0}
                  </div>
                </div>
                <div className="p-6 text-center group hover:bg-primary/5 transition-colors">
                  <div className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2">{t('market_detail.no_shares')}</div>
                  <div className="text-3xl font-black text-foreground">
                    {market.no_shares_outstanding || 0}
                  </div>
                </div>
              </div>

              <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-12 text-sm">
                <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                  <span className="text-muted-foreground font-medium">{t('market_detail.trading_closes')}:</span>
                  <span className="font-bold text-red-500/80">
                    {format(new Date(market.trading_closes_at), 'MMMM d, yyyy h:mm a', { locale: dateLocale })}
                  </span>
                </div>
                <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                  <span className="text-muted-foreground font-medium">{t('market_detail.event_date')}:</span>
                  <span className="font-bold text-foreground/80">{format(new Date(market.event_date), 'MMMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                  <span className="text-muted-foreground font-medium">{t('market_detail.created')}:</span>
                  <span className="font-bold text-foreground/80">{format(new Date(market.created_at), 'MMMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                {market.resolution_source && (
                  <div className="flex justify-between items-center border-b border-primary/5 pb-2">
                    <span className="text-muted-foreground font-medium">{t('market_detail.resolution_source')}:</span>
                    <span className="font-bold text-primary/80 truncate max-w-[200px]">{market.resolution_source}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Comments Section - Enhanced with Threading & Social Features */}
          <div className="mt-10 pt-10 border-t border-primary/10">
            <CommentSection eventId={market.event_id || market.id} />
          </div>
        </div>

        {/* Right Column - Trading Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <TradingPanel
              market={market}
              isPaused={isPlatformPaused || (market ? (categoryPauseStatus.get(market.category)?.paused || market.trading_status === 'paused') : false)}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
