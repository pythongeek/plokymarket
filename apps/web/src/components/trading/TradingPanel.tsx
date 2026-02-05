import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Info,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Market, OutcomeType } from '@/types';
import { useTranslation } from 'react-i18next';

interface TradingPanelProps {
  market: Market;
}

export function TradingPanel({ market }: TradingPanelProps) {
  const { wallet, placeOrder, isAuthenticated } = useStore();
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [outcome, setOutcome] = useState<OutcomeType>('YES');
  const [price, setPrice] = useState(market.yes_price?.toFixed(2) || '0.50');
  const [quantity, setQuantity] = useState('100');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState('');

  const maxPrice = 0.99;
  const minPrice = 0.01;

  const totalCost = parseFloat(price) * parseInt(quantity || '0');
  const potentialProfit = outcome === 'YES'
    ? (1 - parseFloat(price)) * parseInt(quantity || '0')
    : (1 - parseFloat(price)) * parseInt(quantity || '0');

  const handlePriceChange = (value: string) => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue >= minPrice && numValue <= maxPrice) {
      setPrice(value);
    }
  };

  const handleQuantityChange = (value: string) => {
    const numValue = parseInt(value);
    if (!isNaN(numValue) && numValue > 0) {
      setQuantity(value);
    }
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
      <CardHeader className="pb-3">
        <CardTitle className="text-lg">{t('trading.place_order')}</CardTitle>
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
              setPrice(market.yes_price?.toFixed(2) || '0.50');
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
              setPrice(market.no_price?.toFixed(2) || '0.50');
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
            onValueChange={([v]) => setPrice(v.toFixed(2))}
            min={minPrice}
            max={maxPrice}
            step={0.01}
          />
        </div>

        {/* Quantity Input */}
        <div className="space-y-2">
          <Label>{t('trading.quantity')}</Label>
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
                onClick={() => setQuantity(amount.toString())}
                className="flex-1 px-2 py-1 text-xs font-medium rounded bg-muted hover:bg-muted/80 transition-colors"
              >
                {amount}
              </button>
            ))}
          </div>
        </div>

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
              +{((potentialProfit / totalCost) * 100).toFixed(0)}%
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
