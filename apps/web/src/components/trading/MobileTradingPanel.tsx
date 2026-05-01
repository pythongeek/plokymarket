'use client';

/**
 * MobileTradingPanel Component
 * Phase 4 - Touch-optimized trading panel for mobile devices
 * Features: Swipe gestures, large touch targets, Bengali language support
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence, useDragControls, PanInfo } from 'framer-motion';
import { 
  X, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  Info,
  CheckCircle2,
  AlertCircle,
  ChevronUp,
  ChevronDown,
  Zap,
  History,
  SlidersHorizontal,
  RotateCcw,
  Loader2,
  Lock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { 
  Sheet, 
  SheetContent, 
  SheetHeader, 
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from '@/components/ui/sheet';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { 
  Alert,
  AlertDescription,
  AlertTitle,
} from '@/components/ui/alert';
import type { Market, OrderSide } from '@/types';

// ===================================
// TYPES
// ===================================

interface MobileTradingPanelProps {
  market: Market;
  isOpen: boolean;
  onClose: () => void;
  isAuthenticated: boolean;
  balance?: number;
  onPlaceOrder?: (order: OrderParams) => Promise<boolean>;
  onAddToSlip?: (order: SlipItem) => void;
}

interface OrderParams {
  marketId: string;
  side: 'buy' | 'sell';
  outcome: 'YES' | 'NO';
  price: number;
  quantity: number;
  orderType: 'market' | 'limit';
  limitPrice?: number;
}

interface SlipItem {
  marketId: string;
  marketTitle: string;
  outcome: 'YES' | 'NO';
  side: 'buy' | 'sell';
  price: number;
  quantity: number;
  orderType: 'market' | 'limit';
}

interface OrderPreview {
  totalCost: number;
  estimatedShares: number;
  platformFee: number;
  potentialProfit: number;
  maxAffordable: number;
}

// ===================================
// CONSTANTS
// ===================================

const MIN_PRICE = 0.01;
const MAX_PRICE = 0.99;
const PLATFORM_FEE = 0.02;
const QUICK_AMOUNTS = [100, 500, 1000, 5000];

// ===================================
// COMPONENT
// ===================================

export function MobileTradingPanel({
  market,
  isOpen,
  onClose,
  isAuthenticated,
  balance = 0,
  onPlaceOrder,
  onAddToSlip,
}: MobileTradingPanelProps) {
  const { t, i18n } = useTranslation();
  const isBengali = i18n.language === 'bn';

  // State
  const [activeTab, setActiveTab] = useState<'buy' | 'sell'>('buy');
  const [outcome, setOutcome] = useState<'YES' | 'NO'>('YES');
  const [orderType, setOrderType] = useState<'market' | 'limit'>('market');
  const [price, setPrice] = useState('50');
  const [quantity, setQuantity] = useState('100');
  const [limitPrice, setLimitPrice] = useState('50');
  const [slippage, setSlippage] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showOrderHistory, setShowOrderHistory] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  // Computed values
  const currentPrice = orderType === 'market' 
    ? parseFloat(price) 
    : parseFloat(limitPrice);
  
  const parsedQty = parseInt(quantity) || 0;
  const totalCost = (currentPrice / 100) * parsedQty;
  const platformFee = totalCost * PLATFORM_FEE;
  const estimatedShares = parsedQty * (1 - PLATFORM_FEE);
  const maxAffordable = Math.floor(balance / (currentPrice / 100));
  
  const potentialProfit = outcome === 'YES'
    ? (1 - currentPrice / 100) * parsedQty
    : (1 - currentPrice / 100) * parsedQty;

  // Reset when market changes
  useEffect(() => {
    setPrice(((market.yes_price || 0.5) * 100).toFixed(0));
    setLimitPrice(((market.yes_price || 0.5) * 100).toFixed(0));
    setQuantity('100');
    setError(null);
  }, [market.id, market.yes_price]);

  // Handle quick amount selection
  const handleQuickAmount = (amount: number) => {
    const maxAmount = Math.min(amount, maxAffordable);
    setQuantity(maxAmount.toString());
  };

  // Handle percentage of max
  const handlePercentage = (pct: number) => {
    const targetQty = Math.floor(maxAffordable * pct);
    setQuantity(targetQty.toString());
  };

  // Handle order submission
  const handleSubmit = async () => {
    if (!isAuthenticated || !onPlaceOrder) return;
    
    if (parsedQty <= 0) {
      setError(isBengali ? 'পরিমাণ সঠিক নয়' : 'Invalid quantity');
      return;
    }

    if (totalCost > balance) {
      setError(isBengali ? 'অপর্যাপ্ত ব্যালেন্স' : 'Insufficient balance');
      return;
    }

    setError(null);
    setIsSubmitting(true);

    try {
      const success = await onPlaceOrder({
        marketId: market.id,
        side: activeTab,
        outcome,
        price: currentPrice / 100,
        quantity: parsedQty,
        orderType,
        limitPrice: orderType === 'limit' ? parseFloat(limitPrice) / 100 : undefined,
      });

      if (success) {
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      } else {
        setError(isBengali ? 'অর্ডার ব্যর্থ হয়েছে' : 'Order failed');
      }
    } catch (err) {
      setError(isBengali ? 'একটি ত্রুটি ঘটেছে' : 'An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Add to slip
  const handleAddToSlip = () => {
    if (!onAddToSlip) return;
    
    onAddToSlip({
      marketId: market.id,
      marketTitle: market.question || market.title || 'Market',
      outcome,
      side: activeTab,
      price: currentPrice / 100,
      quantity: parsedQty,
      orderType,
    });

    // Show confirmation
    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2000);
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    return isBengali 
      ? `৳${amount.toLocaleString('bn-BD')}`
      : `৳${amount.toLocaleString()}`;
  };

  // Not authenticated view
  if (!isAuthenticated) {
    return (
      <Sheet open={isOpen} onOpenChange={onClose}>
        <SheetContent className="w-full sm:max-w-md mx-auto overflow-y-auto">
          <SheetHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <Wallet className="h-8 w-8 text-primary" />
            </div>
            <SheetTitle>{isBengali ? 'ট্রেডিং শুরু করতে লগইন করুন' : 'Login to Start Trading'}</SheetTitle>
            <SheetDescription>
              {isBengali 
                ? 'এই বাজারে ট্রেড করতে আপনার অ্যাকাউন্টে লগইন করুন অথবা নতুন অ্যাকাউন্ট তৈরি করুন।'
                : 'Login to your account or create a new one to trade on this market.'
              }
            </SheetDescription>
          </SheetHeader>
          
          <div className="space-y-4">
            <Button className="w-full h-14 text-lg" asChild>
              <a href="/login">{isBengali ? 'লগইন করুন' : 'Login'}</a>
            </Button>
            <Button variant="outline" className="w-full h-14 text-lg" asChild>
              <a href="/register">{isBengali ? 'অ্যাকাউন্ট তৈরি করুন' : 'Create Account'}</a>
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent 
        className="w-full sm:max-w-md mx-auto overflow-y-auto p-0 flex flex-col" 
        side="bottom"
      >
        {/* Drag Handle */}
        <div className="flex justify-center py-2">
          <button 
            onClick={() => setIsExpanded(!isExpanded)}
            className="w-12 h-1.5 rounded-full bg-muted-foreground/30 hover:bg-muted-foreground/50 transition-colors"
          />
        </div>

        {/* Header */}
        <SheetHeader className="px-4 pb-2 space-y-1">
          <div className="flex items-center justify-between">
            <SheetTitle className="text-lg font-bold truncate pr-4">
              {market.question || market.title || 'Market'}
            </SheetTitle>
            <Button 
              variant="ghost" 
              size="icon" 
              className="shrink-0 h-8 w-8"
              onClick={onClose}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Balance Display */}
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground">
              {isBengali ? 'উপলব্ধ ব্যালেন্স:' : 'Available Balance:'}
            </span>
            <span className="font-semibold">{formatCurrency(balance)}</span>
          </div>
        </SheetHeader>

        <AnimatePresence mode="wait">
          {isExpanded && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="overflow-hidden"
            >
              {/* Buy/Sell Tabs */}
              <div className="px-4 py-3">
                <Tabs 
                  value={activeTab} 
                  onValueChange={(v) => {
                    setActiveTab(v as 'buy' | 'sell');
                    setOutcome(v === 'buy' ? 'YES' : 'NO');
                  }}
                >
                  <TabsList className="grid w-full grid-cols-2 h-12">
                    <TabsTrigger 
                      value="buy" 
                      className={cn(
                        "text-lg font-bold h-full",
                        activeTab === 'buy' && "data-[state=active]:bg-green-500 data-[state=active]:text-white"
                      )}
                    >
                      <TrendingUp className="h-5 w-5 mr-2" />
                      {isBengali ? 'কিনুন' : 'BUY'}
                    </TabsTrigger>
                    <TabsTrigger 
                      value="sell" 
                      className={cn(
                        "text-lg font-bold h-full",
                        activeTab === 'sell' && "data-[state=active]:bg-red-500 data-[state=active]:text-white"
                      )}
                    >
                      <TrendingDown className="h-5 w-5 mr-2" />
                      {isBengali ? 'বিক্রি করুন' : 'SELL'}
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>

              {/* YES/NO Selection */}
              <div className="px-4 pb-3">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setOutcome('YES')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all touch-manipulation",
                      outcome === 'YES'
                        ? "border-green-500 bg-green-500/10"
                        : "border-border hover:border-green-500/50"
                    )}
                  >
                    <TrendingUp className={cn(
                      "h-6 w-6",
                      outcome === 'YES' ? "text-green-500" : "text-muted-foreground"
                    )} />
                    <span className="font-bold text-lg">{isBengali ? 'হ্যাঁ' : 'YES'}</span>
                    <span className="text-2xl font-black text-green-600">
                      ৳{((market.yes_price || 0.5) * 100).toFixed(0)}
                    </span>
                  </button>
                  
                  <button
                    onClick={() => setOutcome('NO')}
                    className={cn(
                      "flex flex-col items-center justify-center gap-1 p-4 rounded-xl border-2 transition-all touch-manipulation",
                      outcome === 'NO'
                        ? "border-red-500 bg-red-500/10"
                        : "border-border hover:border-red-500/50"
                    )}
                  >
                    <TrendingDown className={cn(
                      "h-6 w-6",
                      outcome === 'NO' ? "text-red-500" : "text-muted-foreground"
                    )} />
                    <span className="font-bold text-lg">{isBengali ? 'না' : 'NO'}</span>
                    <span className="text-2xl font-black text-red-600">
                      ৳{((market.no_price || 0.5) * 100).toFixed(0)}
                    </span>
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-4 space-y-4">
          {/* Quantity Input */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label className="text-base font-medium">
                {isBengali ? 'পরিমাণ (শেয়ার)' : 'Quantity (Shares)'}
              </Label>
              <div className="flex gap-1">
                {[0.25, 0.5, 0.75, 1].map((pct) => (
                  <button
                    key={pct}
                    onClick={() => handlePercentage(pct)}
                    className="px-2 py-1 text-xs bg-muted hover:bg-muted/80 rounded transition-colors touch-manipulation"
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
                onChange={(e) => setQuantity(e.target.value)}
                min={1}
                max={maxAffordable}
                className="text-2xl font-bold h-16 text-center pr-16"
                placeholder="0"
              />
              <button
                onClick={() => handlePercentage(1)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-medium text-primary hover:text-primary/80 transition-colors"
              >
                {isBengali ? 'সর্বোচ্চ' : 'MAX'}
              </button>
            </div>
            
            <p className="text-sm text-muted-foreground text-center">
              {isBengali ? 'সর্বোচ্চ ক্রয়যোগ্য:' : 'Max affordable:'} {maxAffordable.toLocaleString()} {isBengali ? 'শেয়ার' : 'shares'}
            </p>
          </div>

          {/* Quick Amount Buttons */}
          <div className="flex gap-2">
            {QUICK_AMOUNTS.map((amount) => (
              <Button
                key={amount}
                variant="outline"
                className="flex-1 h-12 text-lg font-medium"
                onClick={() => handleQuickAmount(amount)}
              >
                {amount >= 1000 ? `${amount / 1000}K` : amount}
              </Button>
            ))}
          </div>

          {/* Order Type Toggle */}
          <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
            <div className="flex items-center gap-2">
              <SlidersHorizontal className="h-5 w-5 text-muted-foreground" />
              <span className="font-medium">
                {isBengali ? 'মার্কেট অর্ডার' : 'Market Order'}
              </span>
            </div>
            <Switch
              checked={orderType === 'limit'}
              onCheckedChange={(checked) => setOrderType(checked ? 'limit' : 'market')}
            />
          </div>

          {/* Limit Price (for limit orders) */}
          {orderType === 'limit' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="space-y-2"
            >
              <Label className="text-base font-medium">
                {isBengali ? 'লিমিট মূল্য' : 'Limit Price'}
              </Label>
              <Input
                type="number"
                value={limitPrice}
                onChange={(e) => setLimitPrice(e.target.value)}
                min={MIN_PRICE * 100}
                max={MAX_PRICE * 100}
                step={1}
                className="text-xl font-bold h-14 text-center"
                placeholder="50"
              />
            </motion.div>
          )}

          {/* Slippage Settings */}
          <div className="space-y-2">
            <Label className="text-base font-medium">
              {isBengali ? 'স্লিপেজ সহনশীলতা' : 'Slippage Tolerance'}
            </Label>
            <div className="flex gap-2">
              {[0.5, 1, 2].map((tol) => (
                <Button
                  key={tol}
                  variant={slippage === tol ? 'default' : 'outline'}
                  className="flex-1 h-12"
                  onClick={() => setSlippage(tol)}
                >
                  {tol}%
                </Button>
              ))}
              <Input
                type="number"
                value={slippage}
                onChange={(e) => setSlippage(parseFloat(e.target.value) || 1)}
                className="w-20 h-12 text-center"
                min={0.1}
                max={10}
                step={0.1}
              />
            </div>
          </div>

          {/* Order Summary */}
          <div className="p-4 rounded-xl bg-muted/50 space-y-3">
            <h4 className="font-semibold">{isBengali ? 'অর্ডার সারাংশ' : 'Order Summary'}</h4>
            
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isBengali ? 'প্রতি শেয়ার মূল্য:' : 'Price per share:'}
                </span>
                <span className="font-medium">{formatCurrency(currentPrice / 100)}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isBengali ? 'শেয়ার সংখ্যা:' : 'Number of shares:'}
                </span>
                <span className="font-medium">{parsedQty.toLocaleString()}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">
                  {isBengali ? 'প্লাটফর্ম ফি (2%):' : 'Platform fee (2%):'}
                </span>
                <span className="font-medium">{formatCurrency(platformFee)}</span>
              </div>
              
              <div className="border-t pt-2 flex justify-between font-bold text-base">
                <span>{isBengali ? 'মোট খরচ:' : 'Total cost:'}</span>
                <span className="text-green-600">{formatCurrency(totalCost + platformFee)}</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="text-sm">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>{isBengali ? 'ত্রুটি' : 'Error'}</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Success Message */}
          {showSuccess && (
            <Alert className="bg-green-500/10 text-green-600 border-green-500/20">
              <CheckCircle2 className="h-4 w-4" />
              <AlertTitle>{isBengali ? 'সফল!' : 'Success!'}</AlertTitle>
              <AlertDescription>
                {isBengali ? 'আপনার অর্ডার সফলভাবে সম্পন্ন হয়েছে।' : 'Your order has been placed successfully.'}
              </AlertDescription>
            </Alert>
          )}
        </div>

        {/* Action Buttons */}
        <SheetFooter className="p-4 border-t bg-background shrink-0">
          <div className="flex gap-3">
            <Button
              variant="outline"
              size="lg"
              className="flex-1 h-14 text-lg font-bold"
              onClick={handleAddToSlip}
              disabled={parsedQty <= 0 || totalCost > balance}
            >
              <Zap className="h-5 w-5 mr-2" />
              {isBengali ? 'স্লিপে যোগ করুন' : 'Add to Slip'}
            </Button>
            
            <Button
              size="lg"
              className={cn(
                "flex-[2] h-14 text-lg font-bold",
                activeTab === 'buy'
                  ? "bg-green-500 hover:bg-green-600 text-white"
                  : "bg-red-500 hover:bg-red-600 text-white"
              )}
              onClick={handleSubmit}
              disabled={isSubmitting || parsedQty <= 0 || totalCost > balance}
            >
              {isSubmitting ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <>
                  {activeTab === 'buy' 
                    ? (isBengali ? 'কিনুন' : 'BUY') 
                    : (isBengali ? 'বিক্রি করুন' : 'SELL')
                  }
                  <span className="ml-2 text-sm opacity-80">
                    {formatCurrency(totalCost)}
                  </span>
                </>
              )}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

export default MobileTradingPanel;
