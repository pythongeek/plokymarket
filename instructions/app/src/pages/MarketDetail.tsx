import { useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useStore } from '@/store/useStore';
import { OrderBook } from '@/components/trading/OrderBook';
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
  AlertCircle
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';

export function MarketDetail() {
  const { id } = useParams<{ id: string }>();
  const { markets, fetchMarkets } = useStore();

  useEffect(() => {
    fetchMarkets();
  }, [fetchMarkets]);

  const market = markets.find(m => m.id === id);

  if (!market) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-muted-foreground mb-4" />
        <h2 className="text-2xl font-bold mb-2">Market Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The market you're looking for doesn't exist or has been removed.
        </p>
        <Link to="/markets">
          <Button>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Markets
          </Button>
        </Link>
      </div>
    );
  }

  const isResolved = market.status === 'resolved';
  const isClosingSoon = !isResolved && new Date(market.trading_closes_at).getTime() - Date.now() < 7 * 24 * 60 * 60 * 1000;

  return (
    <div className="space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/markets" className="hover:text-foreground transition-colors">
          Markets
        </Link>
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
              Resolved
            </Badge>
          ) : isClosingSoon ? (
            <Badge variant="destructive">
              <Clock className="h-3 w-3 mr-1" />
              Closing Soon
            </Badge>
          ) : (
            <Badge variant="default" className="bg-green-500">
              <TrendingUp className="h-3 w-3 mr-1" />
              Active
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
            <span>Volume: ৳{market.total_volume.toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>
              Closes: {formatDistanceToNow(new Date(market.trading_closes_at), { addSuffix: true })}
            </span>
          </div>
          {market.source_url && (
            <a 
              href={market.source_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 text-primary hover:underline"
            >
              <ExternalLink className="h-4 w-4" />
              <span>Source</span>
            </a>
          )}
        </div>
      </div>

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
                <h2 className="text-xl font-bold">Market Resolved</h2>
                <p className="text-muted-foreground">
                  This market has been resolved to{' '}
                  <span className={market.winning_outcome === 'YES' ? 'text-green-500 font-semibold' : 'text-red-500 font-semibold'}>
                    {market.winning_outcome}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Resolved on {market.resolved_at && format(new Date(market.resolved_at), 'MMM d, yyyy')}
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
              <CardTitle>Market Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div>
                  <div className="text-sm text-muted-foreground">YES Price</div>
                  <div className="text-lg font-semibold text-green-500">
                    ৳{market.yes_price?.toFixed(2) || '0.50'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">NO Price</div>
                  <div className="text-lg font-semibold text-red-500">
                    ৳{market.no_price?.toFixed(2) || '0.50'}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">YES Shares</div>
                  <div className="text-lg font-semibold">
                    {market.yes_shares_outstanding.toLocaleString()}
                  </div>
                </div>
                <div>
                  <div className="text-sm text-muted-foreground">NO Shares</div>
                  <div className="text-lg font-semibold">
                    {market.no_shares_outstanding.toLocaleString()}
                  </div>
                </div>
              </div>

              <Separator />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-muted-foreground">Trading Closes:</span>
                  <span className="ml-2">{format(new Date(market.trading_closes_at), 'MMM d, yyyy h:mm a')}</span>
                </div>
                <div>
                  <span className="text-muted-foreground">Event Date:</span>
                  <span className="ml-2">{format(new Date(market.event_date), 'MMM d, yyyy')}</span>
                </div>
                {market.resolution_source && (
                  <div>
                    <span className="text-muted-foreground">Resolution Source:</span>
                    <span className="ml-2">{market.resolution_source}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">Created:</span>
                  <span className="ml-2">{format(new Date(market.created_at), 'MMM d, yyyy')}</span>
                </div>
              </div>
            </CardContent>
          </Card>
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
