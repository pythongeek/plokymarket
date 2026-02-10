'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Wallet,
  AlertCircle,
  Check,
  ArrowRight,
  ArrowLeft,
  Info,
  Lock,
  Unlock,
  Clock,
  TrendingUp,
  Zap,
  ShieldOff
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import type { MarketDraft } from '@/lib/market-creation/service';

interface LiquidityCommitmentStageProps {
  draft: MarketDraft;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
  adminBypass?: { liquidity: boolean; legal_review: boolean; simulation: boolean };
}

const MIN_LIQUIDITY = 1000;
const RECOMMENDED_LIQUIDITY = 5000;

export function LiquidityCommitmentStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors,
  adminBypass
}: LiquidityCommitmentStageProps) {
  const isBypassed = adminBypass?.liquidity || false;
  const [amount, setAmount] = useState(draft?.liquidity_amount || draft?.liquidity_commitment || (isBypassed ? 0 : MIN_LIQUIDITY));
  const [isDeposited, setIsDeposited] = useState(draft?.liquidity_deposited || isBypassed);
  const [txHash, setTxHash] = useState(draft?.liquidity_tx_hash || '');

  const handleSubmit = async () => {
    const data: Record<string, any> = {
      liquidity_amount: amount,
      liquidity_commitment: amount,
      liquidity_deposited: isDeposited || isBypassed,
      liquidity_tx_hash: txHash || (isBypassed ? 'ADMIN_BYPASS' : undefined),
      admin_bypass_liquidity: isBypassed
    };
    await onSave(data);
  };

  const handleSimulateDeposit = () => {
    setIsDeposited(true);
    setTxHash(`0x${Date.now().toString(16)}${'a'.repeat(40)}`);
  };

  const getLiquidityTier = (value: number) => {
    if (value >= 50000) return { label: 'প্রিমিয়াম (Premium)', color: 'text-amber-400', bg: 'bg-amber-500/10' };
    if (value >= 10000) return { label: 'উচ্চ (High)', color: 'text-emerald-400', bg: 'bg-emerald-500/10' };
    if (value >= 5000) return { label: 'স্ট্যান্ডার্ড (Standard)', color: 'text-blue-400', bg: 'bg-blue-500/10' };
    return { label: 'বেসিক (Basic)', color: 'text-slate-400', bg: 'bg-slate-500/10' };
  };

  const tier = getLiquidityTier(amount);
  const effectiveMin = isBypassed ? 0 : MIN_LIQUIDITY;

  return (
    <div className="space-y-6">
      {/* Bypass Notice */}
      {isBypassed && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-amber-950/30 border border-amber-500/30 rounded-lg p-4 flex items-center gap-3"
        >
          <ShieldOff className="w-5 h-5 text-amber-400 flex-shrink-0" />
          <div>
            <p className="text-sm font-medium text-amber-300">অ্যাডমিন বাইপাস সক্রিয়</p>
            <p className="text-xs text-amber-400/70">
              তারল্য ন্যূনতম $১,০০০ প্রয়োজনীয়তা বাইপাস করা হয়েছে। আপনি যেকোনো পরিমাণে (০ সহ) এগিয়ে যেতে পারেন।
            </p>
          </div>
        </motion.div>
      )}

      {/* Amount Input */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-slate-300 text-lg font-semibold">
            তারল্য পরিমাণ (Liquidity Amount)
          </Label>
          <Badge className={cn("border", tier.bg, tier.color, "border-current/20")}>
            {tier.label}
          </Badge>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-3xl font-bold text-white">$</div>
          <Input
            type="number"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            min={effectiveMin}
            className="bg-slate-900 border-slate-700 text-white text-2xl font-bold h-14"
          />
        </div>

        <Slider
          value={[Math.min(amount, 100000)]}
          onValueChange={([val]) => setAmount(val)}
          min={effectiveMin}
          max={100000}
          step={isBypassed ? 100 : 500}
          className="w-full"
        />

        <div className="flex justify-between text-xs text-slate-500">
          <span>${effectiveMin.toLocaleString()}</span>
          <span>${RECOMMENDED_LIQUIDITY.toLocaleString()} (প্রস্তাবিত)</span>
          <span>$100,000</span>
        </div>
      </div>

      {/* Quick Amount Buttons */}
      <div className="flex flex-wrap gap-2">
        {(isBypassed ? [0, 100, 500] : []).concat([1000, 5000, 10000, 25000, 50000]).map((val) => (
          <Button
            key={val}
            variant="outline"
            size="sm"
            onClick={() => setAmount(val)}
            className={cn(
              "border-slate-700 text-slate-400 hover:text-white",
              amount === val && "border-primary text-primary"
            )}
          >
            ${val.toLocaleString()}
          </Button>
        ))}
      </div>

      {/* Tier Benefits */}
      <Card className="bg-slate-900/50 border-slate-700/50 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">টায়ার সুবিধা (Tier Benefits)</h4>
        <div className="grid grid-cols-2 gap-3">
          <div className={cn("p-3 rounded-lg border", amount >= 1000 ? "border-green-500/30 bg-green-500/5" : "border-slate-700 bg-slate-900/30")}>
            <div className="flex items-center gap-2 mb-1">
              {amount >= 1000 ? <Check className="w-4 h-4 text-green-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
              <span className="text-xs font-medium text-slate-300">বেসিক লিস্টিং</span>
            </div>
            <p className="text-[10px] text-slate-500">$1,000+</p>
          </div>
          <div className={cn("p-3 rounded-lg border", amount >= 5000 ? "border-blue-500/30 bg-blue-500/5" : "border-slate-700 bg-slate-900/30")}>
            <div className="flex items-center gap-2 mb-1">
              {amount >= 5000 ? <Check className="w-4 h-4 text-blue-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
              <span className="text-xs font-medium text-slate-300">ফিচার্ড মার্কেট</span>
            </div>
            <p className="text-[10px] text-slate-500">$5,000+</p>
          </div>
          <div className={cn("p-3 rounded-lg border", amount >= 10000 ? "border-emerald-500/30 bg-emerald-500/5" : "border-slate-700 bg-slate-900/30")}>
            <div className="flex items-center gap-2 mb-1">
              {amount >= 10000 ? <Check className="w-4 h-4 text-emerald-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
              <span className="text-xs font-medium text-slate-300">ডীপ অর্ডারবুক</span>
            </div>
            <p className="text-[10px] text-slate-500">$10,000+</p>
          </div>
          <div className={cn("p-3 rounded-lg border", amount >= 50000 ? "border-amber-500/30 bg-amber-500/5" : "border-slate-700 bg-slate-900/30")}>
            <div className="flex items-center gap-2 mb-1">
              {amount >= 50000 ? <Check className="w-4 h-4 text-amber-400" /> : <Lock className="w-4 h-4 text-slate-500" />}
              <span className="text-xs font-medium text-slate-300">প্রিমিয়াম প্রোমোশন</span>
            </div>
            <p className="text-[10px] text-slate-500">$50,000+</p>
          </div>
        </div>
      </Card>

      {/* Deposit Simulation */}
      {!isDeposited && !isBypassed && (
        <div className="bg-blue-900/20 border border-blue-800/50 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Info className="w-4 h-4 text-blue-400" />
            <span className="text-sm font-medium text-blue-300">ডিপোজিট সিমুলেশন</span>
          </div>
          <p className="text-xs text-blue-400/70 mb-3">
            প্রোডাকশনে এটি একটি প্রকৃত USDC ট্রানজাকশন হবে। এখন সিমুলেট করুন।
          </p>
          <Button
            variant="outline"
            onClick={handleSimulateDeposit}
            className="border-blue-500/40 text-blue-300 hover:text-blue-200"
          >
            <Wallet className="w-4 h-4 mr-2" />
            ডিপোজিট সিমুলেট করুন
          </Button>
        </div>
      )}

      {/* Deposit Confirmed */}
      {(isDeposited || isBypassed) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-900/20 border border-green-800/50 rounded-lg p-4"
        >
          <div className="flex items-center gap-2">
            <Check className="w-5 h-5 text-green-400" />
            <span className="text-sm font-medium text-green-300">
              {isBypassed ? 'অ্যাডমিন বাইপাস — ডিপোজিট অপ্রয়োজনীয়' : 'ডিপোজিট সিমুলেটেড'}
            </span>
          </div>
          {txHash && !isBypassed && (
            <p className="text-xs text-green-400/60 font-mono mt-1">
              TX: {txHash.slice(0, 20)}...
            </p>
          )}
        </motion.div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-slate-800">
        {onBack && (
          <Button variant="outline" onClick={onBack} className="border-slate-700 text-slate-300 hover:text-white">
            <ArrowLeft className="w-4 h-4 mr-2" />
            পিছনে
          </Button>
        )}
        <Button
          onClick={handleSubmit}
          disabled={isSaving || (!isBypassed && amount < MIN_LIQUIDITY)}
          className="ml-auto"
          size="lg"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              সংরক্ষণ হচ্ছে...
            </>
          ) : (
            <>
              পরবর্তী ধাপ
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
