'use client';

import { useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { OrderBook } from '@/components/clob/OrderBook';
import { MarketStatusDisplay } from '@/components/market/MarketStatusDisplay';
import { CommentSection } from '@/components/comments/CommentSection';
import { TradingPanel } from '@/components/trading/TradingPanel';
import { PriceChart } from '@/components/trading/PriceChart';
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
  const { markets, fetchMarkets } = useStore();
  const { t, i18n } = useTranslation();

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const marketId = params.id;
  const market = marketId ? markets.find((m) => m.id === marketId) : undefined;

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

        {/* Market Stats */}
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <BarChart3 className="h-4 w-4" />
            <span>{t('market_detail.volume')}: ৳{market.total_volume.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>{t('market_detail.closes')}: {formatDistanceToNow(new Date(market.trading_closes_at), { addSuffix: true, locale: dateLocale })}</span>
          </div>
          {market.source_url && (
            <a
              href={market.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              <span>{t('market_detail.source')}</span>
            </a>
          )}
        </div>
      </div>

      <MarketStatusDisplay
        market={market}
        oracleConfidence={market.resolution_details?.ai_confidence || 85} // Mock default if not present
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

          {/* Market Details */}
          <Card>
            <CardHeader>
              <CardTitle>{t('market_detail.details')}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">{t('market_detail.yes_price')}</div>
                  <div className="text-lg font-semibold text-green-500">
                    ৳{market.yes_price?.toFixed(2) || '0.50'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('market_detail.no_price')}</div>
                  <div className="text-lg font-semibold text-red-500">
                    ৳{market.no_price?.toFixed(2) || '0.50'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('market_detail.yes_shares')}</div>
                  <div className="text-lg font-semibold">
                    {market.yes_shares_outstanding.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">{t('market_detail.no_shares')}</div>
                  <div className="text-lg font-semibold">
                    {market.no_shares_outstanding.toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">{t('market_detail.trading_closes')}:</span>
                  <span className="ml-2">
                    {format(new Date(market.trading_closes_at), 'MMM d, yyyy h:mm a', { locale: dateLocale })}
                  </span>
                </div>
                <div>
                  <span className="text-muted-foreground">{t('market_detail.event_date')}:</span>
                  <span className="ml-2">{format(new Date(market.event_date), 'MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
                {market.resolution_source && (
                  <div>
                    <span className="text-muted-foreground">{t('market_detail.resolution_source')}:</span>
                    <span className="ml-2">{market.resolution_source}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">{t('market_detail.created')}:</span>
                  <span className="ml-2">{format(new Date(market.created_at), 'MMM d, yyyy', { locale: dateLocale })}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Comments Section */}
          <CommentSection marketId={market.id} marketQuestion={market.question} />
        </div>

        {/* Right Column - Trading Panel */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <TradingPanel market={market} />
          </div>
        </div>
      </div>
    </div>
  );
}
