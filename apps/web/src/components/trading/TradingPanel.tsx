import { useState, useEffect, useMemo } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Info,
  CheckCircle2,
  AlertCircle,
  Zap,
  Target,
  AlertTriangle
} from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import type { Market, OutcomeType } from '@/types';
import { useTranslation } from 'react-i18next';
import { OrderBookMini } from './OrderBookMini';
import { useOrderBook } from '@/hooks/useOrderBook';

interface ExecutionResult {
  status: 'success' | 'slippage_exceeded';
  filledShares?: number;
  averagePrice?: number;
  remainingUsdc?: number;
  maxSlippage?: number;
  actualSlippage?: number;
  suggestedAmount?: number;
}

const calculateExecution = (
  bids: Array<{ price: number; size: number }>,
  asks: Array<{ price: number; size: number }>,
  side: 'yes' | 'no',
  usdcAmount: number,
  slippageTolerance: number
): ExecutionResult => {
  const isBuyYes = side === 'yes';
  // If buying YES, you buy from the Asks (sellers of YES).
  // If buying NO, you buy from the Bids (buyers of YES / sellers of NO).
  const levels = isBuyYes ? asks : bids;

  let remainingUsdc = usdcAmount;
  let totalShares = 0;
  let worstPrice = 0;

  for (const level of levels) {
    const price = isBuyYes ? level.price : 1 - level.price;
    const maxSharesAtLevel = level.size;
    const affordableShares = remainingUsdc / price;
    const sharesToTake = Math.min(maxSharesAtLevel, affordableShares);

    totalShares += sharesToTake;
    remainingUsdc -= sharesToTake * price;
    worstPrice = price;

    if (remainingUsdc <= 0.01) break;
  }

  const averagePrice = totalShares > 0 ? (usdcAmount - remainingUsdc) / totalShares : 0;
  const bestPrice = levels[0]?.price ? (isBuyYes ? levels[0].price : 1 - levels[0].price) : 0.5;
  const actualSlippage = bestPrice > 0 ? (averagePrice - bestPrice) / bestPrice : 0;

  if (actualSlippage > slippageTolerance) {
    return {
      status: 'slippage_exceeded',
      maxSlippage: slippageTolerance,
      actualSlippage,
      suggestedAmount: usdcAmount * (slippageTolerance / actualSlippage), // Approximation
    };
  }

  return { status: 'success', filledShares: totalShares, averagePrice, remainingUsdc };
};

interface TradingPanelProps {
  market: Market;
  isPaused?: boolean;
}

export function TradingPanel({ market, isPaused }: TradingPanelProps) {
  const {
    wallet,
    placeOrder,
    isAuthenticated,
    tradingState,
    setTradingPrice,
    setTradingQuantity,
    toggleOneClick,
    toggleBracket,
    setBracketPrices
  } = useStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [outcome, setOutcome] = useState<OutcomeType>('YES');
  const [price, setPrice] = useState(market.yes_price?.toFixed(2) || '0.50');
  const [quantity, setQuantity] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  // Bracket Order State
  const [stopLoss, setStopLoss] = useState<string>('');
  const [takeProfit, setTakeProfit] = useState<string>('');

  // Advanced Trading State
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [limitPrice, setLimitPrice] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(1);

  const maxPrice = 0.99;
  const minPrice = 0.01;

  // Real-time Order Book Data for Slippage Calculator
  const { bids, asks } = useOrderBook(market.id, 50, 1);
  const [executionWarning, setExecutionWarning] = useState<ExecutionResult | null>(null);

  // Sync Store -> Local
  useEffect(() => {
    if (tradingState.price !== null && tradingState.price !== parseFloat(price)) {
      setPrice(tradingState.price.toFixed(2));
      if (!limitPrice && orderType === 'limit') {
        setLimitPrice(tradingState.price.toFixed(2));
      }
    }
  }, [tradingState.price, limitPrice, orderType, price]);

  useEffect(() => {
    if (tradingState.side && tradingState.side !== activeTab) {
      setActiveTab(tradingState.side);
    }
  }, [tradingState.side]);

  // Computations
  const executionPrice = orderType === 'market'
    ? parseFloat(price || '0')
    : parseFloat(limitPrice || '0');

  const parsedQty = parseInt(quantity || '0');
  const totalCost = executionPrice * parsedQty;

  const potentialProfit = outcome === 'YES'
    ? (1 - executionPrice) * parsedQty
    : (1 - executionPrice) * parsedQty;

  const { maxAmount, estimatedReceive, priceImpact } = useMemo(() => {
    const balance = wallet?.balance || 0;

    // Max Amount Calculation
    const max = executionPrice > 0 ? Math.floor(balance / executionPrice) : 0;

    // Estimated Receive (-2% platform fee)
    const feeRate = 0.02;
    const est = parsedQty * (1 - feeRate);

    // Price Impact Proxy (assume 1% impact per 5,000 shares ordered at market)
    const impact = orderType === 'market' && parsedQty > 0
      ? (parsedQty / 5000) * 0.01
      : 0;

    return { maxAmount: max, estimatedReceive: est, priceImpact: impact };
  }, [wallet?.balance, executionPrice, parsedQty, orderType]);

  // Run Slippage Calculator on changes
  useEffect(() => {
    if (orderType === 'market' && parsedQty > 0) {
      const result = calculateExecution(bids, asks, outcome.toLowerCase() as 'yes' | 'no', totalCost, slippage / 100);
      if (result.status === 'slippage_exceeded') {
        setExecutionWarning(result);
      } else {
        setExecutionWarning(null);
      }
    } else {
      setExecutionWarning(null);
    }
  }, [bids, asks, outcome, totalCost, slippage, orderType, parsedQty]);

  const handlePriceChange = (value: string) => {
    if (isPaused) return;
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= minPrice && numValue <= maxPrice) {
      setPrice(value);
      setTradingPrice(numValue);
    }
  };

  const handleQuantityChange = (value: string) => {
    if (isPaused) return;
    setQuantity(value);
    const num = parseInt(value);
    if (!isNaN(num)) setTradingQuantity(num);
  };

  const setPercentageQuantity = (pct: number) => {
    if (!wallet) return;
    const maxAffordable = maxAmount;
    if (maxAffordable <= 0) return;

    const targetQty = Math.floor(maxAffordable * pct);
    handleQuantityChange(targetQty.toString());
  };

  const handleSubmit = async () => {
    if (isPaused) return;
    if (!isAuthenticated) {
      setError(t('trading.login_required'));
      return;
    }

    setError('');
    setIsSubmitting(true);

    try {
      const success = await placeOrder(
        market.id,
        activeTab,
        outcome,
        parseFloat(price),
        parseInt(quantity),
        orderType,
        orderType === 'limit' ? parseFloat(limitPrice) : undefined,
        slippage / 100
      );

      if (success) {
        setShowSuccess(true);
        // If Bracket Order, place SL/TP (Simulation)
        if (tradingState.isBracket && success) {
          console.log("Placing bracket orders...", { stopLoss, takeProfit });
          // Logic to place separate OCO orders or conditional orders would go here
        }
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(t('trading.insufficient_balance'));
      }
    } catch (err) {
      setError(t('trading.failed'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const quickAmounts = [100, 500, 1000, 5000];

  if (!isAuthenticated) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <div className="flex justify-center">
              <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Wallet className="h-6 w-6 text-primary" />
              </div>
            </div>
            <div>
              <h3 className="font-semibold">{t('trading.login_to_trade')}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {t('trading.login_desc')}
              </p>
            </div>
            <div className="flex gap-2 justify-center">
              <Button variant="outline" asChild>
                <a href="/login">{t('common.login')}</a>
              </Button>
              <Button asChild>
                <a href="/register">{t('common.get_started')}</a>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader className="pb-3 flex flex-row items-center justify-between space-y-0">
          <CardTitle className="text-lg">{t('trading.place_order')}</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1" title="One-Click Trading">
              <Zap className={cn("h-4 w-4", tradingState.isOneClick ? "text-yellow-500 fill-yellow-500" : "text-muted-foreground")} />
              <Switch
                checked={tradingState.isOneClick}
                onCheckedChange={toggleOneClick}
                className="scale-75"
              />
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Buy/Sell Tabs */}
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'buy' | 'sell')}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger
                value="buy"
                className="data-[state=active]:bg-green-500 data-[state=active]:text-white"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                {t('trading.buy')}
              </TabsTrigger>
              <TabsTrigger
                value="sell"
                className="data-[state=active]:bg-red-500 data-[state=active]:text-white"
              >
                <TrendingDown className="h-4 w-4 mr-2" />
                {t('trading.sell')}
              </TabsTrigger>
            </TabsList>
          </Tabs>

          {/* Outcome Selection */}
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => {
                setOutcome('YES');
                // Only update price if not manually locked? For now reset to market default
                if (!tradingState.price) setPrice(market.yes_price?.toFixed(2) || '0.50');
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                outcome === 'YES'
                  ? "border-green-500 bg-green-500/10"
                  : "border-border hover:border-green-500/50"
              )}
            >
              <TrendingUp className="h-4 w-4 text-green-500" />
              <span className="font-medium">{t('common.yes')}</span>
              <Badge variant="secondary" className="ml-1">
                ৳{market.yes_price?.toFixed(2)}
              </Badge>
            </button>

            <button
              onClick={() => {
                setOutcome('NO');
                if (!tradingState.price) setPrice(market.no_price?.toFixed(2) || '0.50');
              }}
              className={cn(
                "flex items-center justify-center gap-2 px-4 py-3 rounded-lg border-2 transition-all",
                outcome === 'NO'
                  ? "border-red-500 bg-red-500/10"
                  : "border-border hover:border-red-500/50"
              )}
            >
              <TrendingDown className="h-4 w-4 text-red-500" />
              <span className="font-medium">{t('common.no')}</span>
              <Badge variant="secondary" className="ml-1">
                ৳{market.no_price?.toFixed(2)}
              </Badge>
            </button>
          </div>

          {/* Order Type Tabs */}
          <div className="flex gap-4 my-4 border-b">
            <button
              onClick={() => setOrderType('market')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${orderType === 'market' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {t('trading.market_order', 'Market Order')}
            </button>
            <button
              onClick={() => setOrderType('limit')}
              className={`pb-2 text-sm font-medium border-b-2 transition-colors ${orderType === 'limit' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'}`}
            >
              {t('trading.limit_order', 'Limit Order')}
            </button>
          </div>

          {/* Quantity (Amount) Input */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label>{t('trading.quantity', 'Amount (Shares)')}</Label>
              <div className="flex gap-1">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => setPercentageQuantity(pct)}
                    className="px-1.5 py-0.5 text-[10px] bg-muted hover:bg-muted/80 rounded transition-colors"
                  >
                    {pct === 1 ? 'Max' : `${pct * 100}%`}
                  </button>
                ))}
              </div>
            </div>
            <div className="relative">
              <Input
                type="number"
                value={quantity}
                onChange={(e) => handleQuantityChange(e.target.value)}
                min={1}
                className="text-lg pr-16"
                placeholder="0"
              />
              <button
                onClick={() => setPercentageQuantity(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                Max
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Max available: {maxAmount.toLocaleString()} shares
            </p>
          </div>

          {/* Limit Price Input (Conditional) */}
          {orderType === 'limit' && (
            <div className="space-y-2 animate-in slide-in-from-top-2">
              <div className="flex justify-between">
                <Label>{t('trading.limit_price', 'Limit Price (BDT)')}</Label>
                <span className="text-xs text-muted-foreground">
                  Range: ৳{minPrice} - ৳{maxPrice}
                </span>
              </div>
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                min={minPrice}
                max={maxPrice}
                step={0.01}
                className="text-lg"
                placeholder="0.50"
              />
            </div>
          )}

          {/* Slippage Tolerance */}
          <div className="space-y-2">
            <Label className="text-sm">{t('trading.slippage', 'Slippage Tolerance')}</Label>
            <div className="flex gap-2">
              {[0.5, 1, 2].map(tol => (
                <button
                  key={tol}
                  onClick={() => setSlippage(tol)}
                  className={`px-3 py-1.5 text-sm rounded-md border transition-colors ${slippage === tol
                    ? 'bg-primary/10 border-primary text-primary font-medium'
                    : 'border-border text-muted-foreground hover:bg-muted'
                    }`}
                >
                  {tol}%
                </button>
              ))}
              <div className="relative w-20">
                <Input
                  type="number"
                  value={slippage}
                  onChange={(e) => setSlippage(parseFloat(e.target.value))}
                  className="h-full pr-6 text-sm"
                  step={0.1}
                  min={0.1}
                />
                <span className="absolute right-2 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
              </div>
            </div>
          </div>

          {/* Price Impact Warning */}
          {priceImpact > 0.01 && (
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>High Price Impact</AlertTitle>
              <AlertDescription className="text-xs mt-1">
                Your order may move the market price by {(priceImpact * 100).toFixed(2)}%.
                Consider reducing size or using a limit order.
              </AlertDescription>
            </Alert>
          )}

          {/* Advanced Settings Checkbox/Toggle */}
          <div className="flex items-center justify-between py-2 border-t border-b">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4" />
              <span className="text-sm font-medium">Bracket Order</span>
            </div>
            <Switch checked={tradingState.isBracket} onCheckedChange={toggleBracket} />
          </div>

          {/* Bracket Inputs */}
          {tradingState.isBracket && (
            <div className="grid grid-cols-2 gap-2 animate-in slide-in-from-top-2">
              <div className="space-y-1">
                <Label className="text-xs">Take Profit</Label>
                <Input
                  placeholder="TP"
                  className="h-8 text-sm"
                  value={takeProfit}
                  onChange={(e) => setTakeProfit(e.target.value)}
                />
              </div>
              <div className="space-y-1">
                <Label className="text-xs">Stop Loss</Label>
                <Input
                  placeholder="SL"
                  className="h-8 text-sm"
                  value={stopLoss}
                  onChange={(e) => setStopLoss(e.target.value)}
                />
              </div>
            </div>
          )}

          {/* Order Summary */}
          <div className="rounded-xl bg-muted/50 p-4 space-y-3 border border-border/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('trading.estimated_shares', 'Estimated shares')}</span>
              <span className="font-medium">{estimatedReceive.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">{t('trading.platform_fee', 'Platform fee (2%)')}</span>
              <span className="font-medium text-muted-foreground">৳{(totalCost * 0.02).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm pt-2 border-t font-semibold">
              <span>{t('trading.total_cost', 'Total cost')}</span>
              <span>৳{totalCost.toFixed(2)}</span>
            </div>
            {wallet && (
              <div className="flex justify-between text-xs pt-1 text-muted-foreground">
                <span>{t('trading.available_balance', 'Available balance')}</span>
                <span>৳{wallet.balance.toLocaleString()}</span>
              </div>
            )}
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-500">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}

          {/* Slippage Exceeded Warning & Resolution Options */}
          {executionWarning?.status === 'slippage_exceeded' && (
            <Alert variant="destructive" className="bg-destructive/10 text-destructive border-destructive/20 select-none">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Slippage Tolerance Exceeded!</AlertTitle>
              <AlertDescription className="text-xs mt-2 space-y-3">
                <p>
                  Your order of ৳{totalCost.toFixed(2)} would cause <strong>{(executionWarning.actualSlippage! * 100).toFixed(2)}%</strong> slippage,
                  exceeding your maximum of {(executionWarning.maxSlippage! * 100).toFixed(2)}%.
                </p>
                <div className="space-y-2 mt-2">
                  <p className="font-semibold text-[10px] uppercase opacity-70">Resolution Options:</p>
                  <div className="grid grid-cols-1 gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs justify-start h-8"
                      onClick={() => {
                        const newMaxUsdc = executionWarning.suggestedAmount || 0;
                        const safeQty = Math.floor(newMaxUsdc / executionPrice);
                        handleQuantityChange(safeQty.toString());
                      }}
                    >
                      1. Reduce size to ~{Math.floor((executionWarning.suggestedAmount || 0) / executionPrice)} shares
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs justify-start h-8"
                      onClick={() => setSlippage(Math.ceil(executionWarning.actualSlippage! * 100 * 10) / 10)}
                    >
                      2. Increase tolerance to {(executionWarning.actualSlippage! * 100).toFixed(1)}%
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="w-full text-xs justify-start h-8"
                      onClick={() => {
                        setOrderType('limit');
                        setLimitPrice(price);
                      }}
                    >
                      3. Switch to Limit Order
                    </Button>
                  </div>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {showSuccess && (
            <div className="flex items-center gap-2 text-sm text-green-500">
              <CheckCircle2 className="h-4 w-4" />
              {t('trading.success_desc')}
            </div>
          )}

          {/* Submit Button */}
          <Button
            onClick={handleSubmit}
            disabled={
              isSubmitting ||
              parsedQty <= 0 ||
              totalCost > (wallet?.balance || 0) ||
              isPaused ||
              executionWarning?.status === 'slippage_exceeded'
            }
            className={cn(
              "w-full h-14 text-lg font-bold rounded-xl",
              activeTab === 'buy'
                ? "bg-green-500 hover:bg-green-600 text-white shadow-lg shadow-green-500/20"
                : "bg-red-500 hover:bg-red-600 text-white shadow-lg shadow-red-500/20"
            )}
          >
            {isPaused ? (
              t('trading.paused', 'Trading Paused')
            ) : isSubmitting ? (
              t('trading.processing')
            ) : (
              <>
                {orderType === 'market'
                  ? (activeTab === 'buy' ? t('trading.buy_now', 'Buy Now') : t('trading.sell_now', 'Sell Now'))
                  : t('trading.place_limit', 'Place Limit Order')}
              </>
            )}
          </Button>

          {/* Info & Warning for One Click */}
          {tradingState.isOneClick && (
            <div className="flex items-start gap-2 text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
              <Zap className="h-3 w-3 mt-0.5" />
              <p>One-Click Trading is Active. Orders placed via ladder are instant.</p>
            </div>
          )}

          {/* Info */}
          <div className="flex items-start gap-2 text-xs text-muted-foreground">
            <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
            <p>
              {t('trading.info', {
                outcome: outcome === 'YES' ? t('common.yes') : t('common.no'),
                opposite: outcome === 'YES' ? t('common.no') : t('common.yes')
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Mini Order Book Visualization */}
      <div className="mt-4">
        <h3 className="text-sm font-semibold mb-2">Order Book Snapshot</h3>
        <OrderBookMini marketId={market.id} />
      </div>

    </div> // extra wrap for parent
  );
}
