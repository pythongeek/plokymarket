import { useState, useEffect } from 'react';
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
  Target
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Market, OutcomeType } from '@/types';
import { useTranslation } from 'react-i18next';

interface TradingPanelProps {
  market: Market;
}

export function TradingPanel({ market }: TradingPanelProps) {
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

  const maxPrice = 0.99;
  const minPrice = 0.01;

  // Sync Store -> Local
  useEffect(() => {
    if (tradingState.price !== null && tradingState.price !== parseFloat(price)) {
      setPrice(tradingState.price.toFixed(2));
    }
  }, [tradingState.price]); // Intentionally omitting 'price' dependency to avoid loop

  useEffect(() => {
    if (tradingState.side && tradingState.side !== activeTab) {
      setActiveTab(tradingState.side);
    }
  }, [tradingState.side]);

  const totalCost = parseFloat(price) * parseInt(quantity || '0');
  const potentialProfit = outcome === 'YES'
    ? (1 - parseFloat(price)) * parseInt(quantity || '0')
    : (1 - parseFloat(price)) * parseInt(quantity || '0');

  const handlePriceChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= minPrice && numValue <= maxPrice) {
      setPrice(value);
      setTradingPrice(numValue);
    }
  };

  const handleQuantityChange = (value: string) => {
    setQuantity(value);
    const num = parseInt(value);
    if (!isNaN(num)) setTradingQuantity(num);
  };

  const setPercentageQuantity = (pct: number) => {
    if (!wallet) return;
    // For BUY: Cost = Price * Qty -> Qty = Balance * Pct / Price
    // For SELL: Qty = Held Shares * Pct (Complex logic, let's stick to Wallet Balance for buys)

    const balance = wallet.balance;
    const currentPrice = parseFloat(price);
    if (currentPrice <= 0) return;

    const maxAffordable = Math.floor(balance / currentPrice);
    const targetQty = Math.floor(maxAffordable * pct);

    handleQuantityChange(targetQty.toString());
  };

  const handleSubmit = async () => {
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
        parseInt(quantity)
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

        {/* Price Input */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t('trading.price_per_share')}</Label>
            <span className="text-sm text-muted-foreground">
              {t('trading.range')}: ৳{minPrice} - ৳{maxPrice}
            </span>
          </div>
          <div className="flex gap-2">
            <Input
              type="number"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              min={minPrice}
              max={maxPrice}
              step={0.01}
              className="text-lg"
            />
            <div className="flex items-center px-3 bg-muted rounded-md">
              <span className="text-sm font-medium">BDT</span>
            </div>
          </div>
          <Slider
            value={[parseFloat(price)]}
            onValueChange={([v]) => handlePriceChange(v.toFixed(2))}
            min={minPrice}
            max={maxPrice}
            step={0.01}
          />
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label>{t('trading.quantity')}</Label>
            <div className="flex gap-1">
              {[0.25, 0.5, 0.75, 1].map((pct) => (
                <button
                  key={pct}
                  onClick={() => setPercentageQuantity(pct)}
                  className="px-1.5 py-0.5 text-[10px] bg-muted hover:bg-muted/80 rounded"
                >
                  {pct * 100}%
                </button>
              ))}
            </div>
          </div>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => handleQuantityChange(e.target.value)}
            min={1}
            className="text-lg"
          />
          <div className="flex gap-2">
            {quickAmounts.map((amount) => (
              <button
                key={amount}
                onClick={() => handleQuantityChange(amount.toString())}
                className="flex-1 px-2 py-1 text-xs font-medium rounded bg-muted hover:bg-muted/80 transition-colors"
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

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
        <div className="rounded-lg bg-muted p-4 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('trading.total_cost')}</span>
            <span className="font-medium">৳{totalCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('trading.potential_profit')}</span>
            <span className="font-medium text-green-500">
              +৳{potentialProfit.toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">{t('trading.return_on_win')}</span>
            <span className="font-medium text-green-500">
              +{((potentialProfit / totalCost || 0) * 100).toFixed(0)}%
            </span>
          </div>
          {wallet && (
            <div className="flex justify-between text-sm pt-2 border-t">
              <span className="text-muted-foreground">{t('trading.available_balance')}</span>
              <span className="font-medium">৳{wallet.balance.toLocaleString()}</span>
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
          disabled={isSubmitting || totalCost <= 0}
          className={cn(
            "w-full text-lg font-semibold",
            activeTab === 'buy'
              ? "bg-green-500 hover:bg-green-600"
              : "bg-red-500 hover:bg-red-600"
          )}
        >
          {isSubmitting ? (
            t('trading.processing')
          ) : (
            <>
              {activeTab === 'buy' ? t('trading.buy') : t('trading.sell')} {outcome === 'YES' ? t('common.yes') : t('common.no')}
              <span className="ml-2">৳{totalCost.toFixed(2)}</span>
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
  );
}
