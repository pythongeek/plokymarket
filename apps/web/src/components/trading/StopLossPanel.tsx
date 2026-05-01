'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  X,
  CheckCircle,
  Clock,
  ChevronDown,
  Zap,
  Info,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';

interface StopLossPanelProps {
  marketId: string;
  currentPrice: number; // 0-1 probability
  position?: {
    side: 'YES' | 'NO';
    quantity: number;
    avgPrice: number;
  };
  onClose?: () => void;
}

type OrderType = 'stop_loss' | 'stop_win' | 'take_profit';
type OrderSide = 'buy' | 'sell';

export function StopLossPanel({ marketId, currentPrice, position, onClose }: StopLossPanelProps) {
  const { currentUser } = useStore();
  const supabase = createClient();

  const [orderType, setOrderType] = useState<OrderType>('stop_loss');
  const [triggerPrice, setTriggerPrice] = useState<string>('');
  const [slippage, setSlippage] = useState<number>(0.5);
  const [quantity, setQuantity] = useState<string>('');
  const [orderSide, setOrderSide] = useState<OrderSide>('sell');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeConditions, setActiveConditions] = useState<any[]>([]);

  const slippageOptions = [
    { label: '0.1%', value: 0.1 },
    { label: '0.5%', value: 0.5 },
    { label: '1%', value: 1 },
    { label: '2%', value: 2 },
    { label: '5%', value: 5 },
  ];

  const orderTypeLabels: Record<OrderType, { label: string; labelBn: string; desc: string }> = {
    stop_loss: {
      label: 'Stop Loss',
      labelBn: 'স্টপ লস',
      desc: 'Price drops to trigger — sell to limit losses',
    },
    stop_win: {
      label: 'Stop Win',
      labelBn: 'স্টপ উইন',
      desc: 'Price rises to lock in profits',
    },
    take_profit: {
      label: 'Take Profit',
      labelBn: 'টেক প্রফিট',
      desc: 'Sell when price reaches target',
    },
  };

  const estimatedCost = useCallback(() => {
    const qty = parseFloat(quantity) || 0;
    const price = parseFloat(triggerPrice) || currentPrice;
    return qty * price;
  }, [quantity, triggerPrice, currentPrice]);

  const isValidOrder = useCallback(() => {
    const qty = parseFloat(quantity);
    const price = parseFloat(triggerPrice);
    if (!qty || qty <= 0) return false;
    if (!price || price <= 0 || price >= 1) return false;
    if (orderType === 'stop_loss' && price >= currentPrice) return false;
    if (orderType === 'stop_win' && price <= currentPrice) return false;
    return true;
  }, [quantity, triggerPrice, orderType, currentPrice]);

  const handleSubmit = async () => {
    if (!isValidOrder() || isSubmitting) return;
    setIsSubmitting(true);

    try {
      const res = await fetch('/api/orders/conditional', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          marketId,
          type: orderType,
          triggerPrice: parseFloat(triggerPrice),
          orderSide,
          orderOutcome: orderSide === 'buy' ? 'YES' : 'NO',
          quantity: parseFloat(quantity),
          slippageTolerance: slippage,
        }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || 'Failed to create conditional order');

      toast({
        title: 'Conditional Order Placed',
        description: `${orderTypeLabels[orderType].labelBn} — ${quantity} @ ${triggerPrice}`,
        variant: 'default',
      });

      setTriggerPrice('');
      setQuantity('');
      fetchConditions();
    } catch (err: any) {
      toast({
        title: 'Order Failed',
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const fetchConditions = useCallback(async () => {
    const { data } = await supabase
      .from('conditional_orders')
      .select('*')
      .eq('user_id', currentUser?.id)
      .eq('market_id', marketId)
      .eq('status', 'active')
      .order('created_at', { ascending: false });

    if (data) setActiveConditions(data);
  }, [supabase, currentUser?.id, marketId]);

  const cancelCondition = async (id: string) => {
    const { error } = await supabase
      .from('conditional_orders')
      .update({ status: 'cancelled' })
      .eq('id', id);

    if (!error) {
      setActiveConditions((prev) => prev.filter((c) => c.id !== id));
      toast({ title: 'Order Cancelled', description: 'Conditional order removed' });
    }
  };

  useEffect(() => {
    if (currentUser?.id && marketId) fetchConditions();
  }, [currentUser?.id, marketId, fetchConditions]);

  return (
    <Card className="bg-slate-900 border-slate-800">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-orange-400" />
            <CardTitle className="text-white text-sm">কন্ডিশনাল অর্ডার</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Badge className="bg-green-400/10 text-green-400 text-xs">
              {currentPrice.toFixed(2)}৳
            </Badge>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose} className="h-6 w-6 p-0">
                <X className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Order Type Selector */}
        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-800 rounded-lg">
          {(Object.keys(orderTypeLabels) as OrderType[]).map((type) => (
            <button
              key={type}
              onClick={() => setOrderType(type)}
              className={cn(
                'px-2 py-1.5 rounded-md text-xs font-medium transition-all',
                orderType === type
                  ? 'bg-orange-400/20 text-orange-400'
                  : 'text-slate-400 hover:text-white'
              )}
            >
              {orderTypeLabels[type].labelBn}
            </button>
          ))}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-400">{orderTypeLabels[orderType].desc}</p>

        {/* Trigger Price */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">ট্রিগার প্রাইস (০-১)</label>
          <div className="relative">
            <Input
              type="number"
              min="0"
              max="1"
              step="0.01"
              placeholder="0.50"
              value={triggerPrice}
              onChange={(e) => setTriggerPrice(e.target.value)}
              className="bg-slate-800 border-slate-700 text-white pr-8 font-mono"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 text-xs">
              ৳
            </span>
          </div>
          {/* Quick price buttons */}
          <div className="flex gap-1">
            {[0.25, 0.50, 0.75].map((p) => (
              <Button
                key={p}
                variant="outline"
                size="sm"
                className="h-6 text-xs border-slate-700 text-slate-400"
                onClick={() => setTriggerPrice(p.toFixed(2))}
              >
                {p.toFixed(2)}
              </Button>
            ))}
          </div>
        </div>

        {/* Slippage Tolerance */}
        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="text-xs text-slate-400">স্লিপেজ টলারেন্স</label>
            <span className="text-xs text-orange-400 font-mono">{slippage}%</span>
          </div>
          <Slider
            value={[slippage]}
            onValueChange={([v]) => setSlippage(v)}
            min={0.1}
            max={5}
            step={0.1}
            className="w-full"
          />
          <div className="flex justify-between">
            {slippageOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setSlippage(opt.value)}
                className={cn(
                  'text-[10px] px-1 py-0.5 rounded',
                  slippage === opt.value
                    ? 'bg-orange-400/20 text-orange-400'
                    : 'text-slate-500'
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Quantity */}
        <div className="space-y-1.5">
          <label className="text-xs text-slate-400">পরিমাণ (শেয়ার)</label>
          <Input
            type="number"
            min="1"
            step="1"
            placeholder="100"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            className="bg-slate-800 border-slate-700 text-white font-mono"
          />
          {position && (
            <Button
              variant="link"
              size="sm"
              className="text-xs text-blue-400 p-0 h-auto"
              onClick={() => setQuantity(position.quantity.toString())}
            >
              Max: {position.quantity} shares
            </Button>
          )}
        </div>

        {/* Order Side */}
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-400">অ্যাকশন:</span>
          <div className="flex gap-2">
            <Button
              variant={orderSide === 'sell' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-xs',
                orderSide === 'sell'
                  ? 'bg-red-500/20 text-red-400 border-red-500/30 hover:bg-red-500/30'
                  : 'border-slate-700 text-slate-400'
              )}
              onClick={() => setOrderSide('sell')}
            >
              বিক্রি
            </Button>
            <Button
              variant={orderSide === 'buy' ? 'default' : 'outline'}
              size="sm"
              className={cn(
                'text-xs',
                orderSide === 'buy'
                  ? 'bg-green-500/20 text-green-400 border-green-500/30 hover:bg-green-500/30'
                  : 'border-slate-700 text-slate-400'
              )}
              onClick={() => setOrderSide('buy')}
            >
              ক্রয়
            </Button>
          </div>
        </div>

        {/* Summary */}
        <div className="bg-slate-800/50 rounded-lg p-3 space-y-1.5">
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">অনুমানিত মূল্য:</span>
            <span className="text-white font-mono">
              ৳{(estimatedCost() * 100).toFixed(2)}
            </span>
          </div>
          <div className="flex justify-between text-xs">
            <span className="text-slate-400">সর্বোচ্চ ক্ষতি:</span>
            <span className="text-red-400 font-mono">
              ৳{(parseFloat(quantity || '0') * slippage / 100).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Submit */}
        <Button
          className="w-full bg-orange-400 hover:bg-orange-500 text-black font-medium disabled:opacity-50"
          disabled={!isValidOrder() || isSubmitting}
          onClick={handleSubmit}
        >
          {isSubmitting ? (
            <Clock className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <Zap className="w-4 h-4 mr-2" />
          )}
          {orderTypeLabels[orderType].labelBn} সেট করুন
        </Button>

        {/* Active Conditions */}
        {activeConditions.length > 0 && (
          <>
            <Separator className="bg-slate-800" />
            <div className="space-y-2">
              <p className="text-xs text-slate-400 font-medium">সক্রিয় কন্ডিশন</p>
              <AnimatePresence>
                {activeConditions.map((cond) => (
                  <motion.div
                    key={cond.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 10 }}
                    className="flex items-center justify-between bg-slate-800/30 rounded-lg px-3 py-2"
                  >
                    <div className="flex items-center gap-2">
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-[10px]',
                          cond.type === 'stop_loss'
                            ? 'text-red-400 border-red-400/30'
                            : 'text-green-400 border-green-400/30'
                        )}
                      >
                        {cond.type.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-white font-mono">
                        @ {parseFloat(cond.trigger_price).toFixed(2)}
                      </span>
                      <span className="text-xs text-slate-500">
                        × {cond.quantity}
                      </span>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-5 w-5 p-0 text-slate-500 hover:text-red-400"
                      onClick={() => cancelCondition(cond.id)}
                    >
                      <X className="w-3 h-3" />
                    </Button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
