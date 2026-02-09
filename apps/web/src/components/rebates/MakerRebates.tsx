'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Slider } from '@/components/ui/slider';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from '@/components/ui/dialog';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import {
  Wallet,
  TrendingUp,
  Calculator,
  Clock,
  Award,
  Info,
  CheckCircle2,
  Sparkles,
  Zap
} from 'lucide-react';

// ===================================
// TYPES
// ===================================

interface RebateTier {
  id: number;
  tier_name: string;
  min_volume: number;
  max_volume: number | null;
  rebate_rate: number;
  min_spread: number;
  benefits: {
    withdrawal_fees: string;
    api_rate_limit: string;
    support: string;
    custom_terms?: boolean;
  };
}

interface SpreadMultiplier {
  id: number;
  spread_tier: string;
  min_spread: number;
  max_spread: number | null;
  multiplier: number;
  min_order_size: number;
  description: string;
}

interface CurrentRebateStatus {
  user_id: string;
  year_month: string;
  maker_volume: number;
  qualifying_volume: number;
  rebate_tier: number;
  tier_name: string;
  rebate_rate_percent: number;
  estimated_rebate: number;
  claimed_rebate: number;
  available_to_claim: number;
  benefits: any;
  last_updated: string;
}

interface RebateHistory {
  user_id: string;
  year_month: string;
  rebate_period_start: string;
  rebate_period_end: string;
  total_maker_volume: number;
  qualifying_volume: number;
  base_rate_percent: number;
  spread_multiplier: number;
  final_rate_percent: number;
  gross_rebate_amount: number;
  net_rebate_amount: number;
  claim_status: 'pending' | 'claimed' | 'processing' | 'paid' | 'expired';
  claimed_at: string | null;
  payment_method: string | null;
  payment_tx_hash: string | null;
  tier_name: string;
}

// ===================================
// TIER CARD COMPONENT
// ===================================

function TierCard({
  tier,
  isCurrent,
  isNext,
  currentVolume,
}: {
  tier: RebateTier;
  isCurrent: boolean;
  isNext: boolean;
  currentVolume: number;
}) {
  const volumeProgress = Math.min(
    100,
    (currentVolume / tier.min_volume) * 100
  );
  const volumeToNext = tier.max_volume
    ? tier.max_volume - currentVolume
    : null;

  const tierColors: Record<number, string> = {
    1: 'from-slate-500 to-slate-600',
    2: 'from-amber-400 to-amber-600',
    3: 'from-blue-400 to-blue-600',
    4: 'from-purple-500 to-purple-700',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl p-6 border-2 transition-all',
        isCurrent
          ? 'border-primary shadow-lg scale-105'
          : isNext
          ? 'border-dashed border-muted-foreground/30'
          : 'border-muted'
      )}
    >
      {isCurrent && (
        <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-xs font-bold px-3 py-1 rounded-bl-lg">
          Current Tier
        </div>
      )}

      <div
        className={cn(
          'w-14 h-14 rounded-xl bg-gradient-to-br flex items-center justify-center mb-4',
          tierColors[tier.id]
        )}
      >
        <Award className="w-7 h-7 text-white" />
      </div>

      <h3 className="text-xl font-bold mb-1">{tier.tier_name}</h3>
      <p className="text-3xl font-black text-primary mb-2">
        {(tier.rebate_rate * 100).toFixed(2)}%
        <span className="text-sm font-normal text-muted-foreground ml-2">
          rebate
        </span>
      </p>

      <div className="space-y-2 mb-4">
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Min Volume</span>
          <span className="font-medium">
            ${tier.min_volume.toLocaleString()}
          </span>
        </div>
        {tier.max_volume && (
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Max Volume</span>
            <span className="font-medium">
              ${tier.max_volume.toLocaleString()}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span className="text-muted-foreground">Min Spread</span>
          <span className="font-medium">
            {(tier.min_spread * 100).toFixed(2)}%
          </span>
        </div>
      </div>

      {isCurrent && volumeToNext && (
        <div className="space-y-2">
          <div className="flex justify-between text-xs">
            <span className="text-muted-foreground">Progress to next tier</span>
            <span className="font-medium">
              ${volumeToNext.toLocaleString()} more
            </span>
          </div>
          <Progress value={volumeProgress} className="h-2" />
        </div>
      )}

      <div className="mt-4 pt-4 border-t space-y-1">
        <p className="text-xs font-medium text-muted-foreground">Benefits:</p>
        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary" className="text-xs">
            {tier.benefits.withdrawal_fees} withdrawal
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {tier.benefits.api_rate_limit} API
          </Badge>
          <Badge variant="secondary" className="text-xs">
            {tier.benefits.support} support
          </Badge>
          {tier.benefits.custom_terms && (
            <Badge variant="default" className="text-xs">
              Custom terms
            </Badge>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ===================================
// SPREAD MULTIPLIER CARD
// ===================================

function SpreadMultiplierCard({
  config,
  isActive,
}: {
  config: SpreadMultiplier;
  isActive: boolean;
}) {
  return (
    <div
      className={cn(
        'p-4 rounded-xl border transition-all',
        isActive
          ? 'border-primary bg-primary/5'
          : 'border-muted bg-muted/30'
      )}
    >
      <div className="flex items-center justify-between mb-2">
        <Badge
          variant={isActive ? 'default' : 'secondary'}
          className="capitalize"
        >
          {config.spread_tier}
        </Badge>
        <span className="text-2xl font-bold">{config.multiplier}x</span>
      </div>
      <p className="text-sm text-muted-foreground mb-2">
        {config.description}
      </p>
      <div className="flex items-center gap-4 text-xs">
        <span className="text-muted-foreground">
          Min size: ${config.min_order_size.toLocaleString()}
        </span>
      </div>
    </div>
  );
}

// ===================================
// REBATE CALCULATOR
// ===================================

function RebateCalculator({
  tiers,
  spreadMultipliers,
}: {
  tiers: RebateTier[];
  spreadMultipliers: SpreadMultiplier[];
}) {
  const [volume, setVolume] = useState(500000);
  const [spread, setSpread] = useState(0.15);
  const [orderSize, setOrderSize] = useState(5000);

  const currentTier =
    tiers.find((t) => volume >= t.min_volume && (!t.max_volume || volume < t.max_volume)) ||
    tiers[0];

  const spreadConfig =
    spreadMultipliers.find(
      (s) => spread >= s.min_spread * 100 && (!s.max_spread || spread < s.max_spread * 100)
    ) || spreadMultipliers[spreadMultipliers.length - 1];

  const sizeMultiplier =
    orderSize >= 10000 ? 1.0 : orderSize >= 5000 ? 0.9 : orderSize >= 2000 ? 0.8 : 0.5;

  const finalMultiplier = spreadConfig.multiplier * sizeMultiplier;
  const finalRate = currentTier.rebate_rate * finalMultiplier;
  const estimatedRebate = volume * finalRate;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-emerald-600 to-teal-600 text-white">
        <CardTitle className="flex items-center gap-2">
          <Calculator className="w-5 h-5" />
          Rebate Calculator
        </CardTitle>
        <CardDescription className="text-white/80">
          Estimate your potential rebates
        </CardDescription>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Volume Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Monthly Maker Volume</label>
            <span className="font-bold">${volume.toLocaleString()}</span>
          </div>
          <Slider
            value={[volume]}
            onValueChange={([v]) => setVolume(v)}
            max={20000000}
            step={100000}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>$0</span>
            <span>$10M</span>
            <span>$20M</span>
          </div>
        </div>

        {/* Spread Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Average Spread</label>
            <span className="font-bold">{spread.toFixed(2)}%</span>
          </div>
          <Slider
            value={[spread]}
            onValueChange={([s]) => setSpread(s)}
            max={0.5}
            step={0.01}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>0%</span>
            <span>0.25%</span>
            <span>0.50%</span>
          </div>
        </div>

        {/* Order Size Slider */}
        <div className="space-y-3">
          <div className="flex justify-between">
            <label className="text-sm font-medium">Average Order Size</label>
            <span className="font-bold">${orderSize.toLocaleString()}</span>
          </div>
          <Slider
            value={[orderSize]}
            onValueChange={([s]) => setOrderSize(s)}
            max={20000}
            step={1000}
            className="w-full"
          />
        </div>

        {/* Results */}
        <div className="bg-muted rounded-xl p-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Base Rate</span>
            <span className="font-medium">
              {(currentTier.rebate_rate * 100).toFixed(2)}%
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Spread Multiplier</span>
            <span className="font-medium">{finalMultiplier.toFixed(2)}x</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-muted-foreground">Final Rate</span>
            <span className="font-bold text-primary">
              {(finalRate * 100).toFixed(3)}%
            </span>
          </div>
          <div className="border-t pt-3 flex justify-between items-center">
            <span className="font-medium">Estimated Monthly Rebate</span>
            <span className="text-2xl font-black text-emerald-600">
              ${estimatedRebate.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// ===================================
// MAIN MAKER REBATES COMPONENT
// ===================================

export function MakerRebates() {
  const [currentStatus, setCurrentStatus] = useState<CurrentRebateStatus | null>(
    null
  );
  const [history, setHistory] = useState<RebateHistory[]>([]);
  const [tiers, setTiers] = useState<RebateTier[]>([]);
  const [spreadMultipliers, setSpreadMultipliers] = useState<
    SpreadMultiplier[]
  >([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRebateData();
  }, []);

  const loadRebateData = async () => {
    setLoading(true);
    try {
      // Load current status
      const statusRes = await fetch('/api/rebates?type=current');
      if (statusRes.ok) {
        const statusData = await statusRes.json();
        setCurrentStatus(statusData.data.current);
        setTiers(statusData.data.tiers);
      }

      // Load history
      const historyRes = await fetch('/api/rebates?type=history');
      if (historyRes.ok) {
        const historyData = await historyRes.json();
        setHistory(historyData.data);
      }

      // Load tiers config
      const tiersRes = await fetch('/api/rebates?type=tiers');
      if (tiersRes.ok) {
        const tiersData = await tiersRes.json();
        setSpreadMultipliers(tiersData.data.spreadMultipliers);
      }
    } catch (error) {
      console.error('Error loading rebate data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Card className="animate-pulse h-48" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="animate-pulse h-64" />
          ))}
        </div>
      </div>
    );
  }

  const currentVolume = currentStatus?.maker_volume || 0;
  const currentTierId = currentStatus?.rebate_tier || 1;
  const nextTier = tiers.find((t) => t.id === currentTierId + 1);

  return (
    <TooltipProvider>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <h2 className="text-3xl font-bold flex items-center gap-2">
              <Wallet className="w-8 h-8 text-primary" />
              Maker Rebates
            </h2>
            <p className="text-muted-foreground mt-1">
              Earn rebates for providing liquidity with tight spreads
            </p>
          </div>
          <Badge variant="outline" className="w-fit">
            <Sparkles className="w-4 h-4 mr-1" />
            Weekly Distributions
          </Badge>
        </div>

        {/* Current Status */}
        {currentStatus && (
          <Card className="overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-primary/10 to-primary/5">
              <CardTitle className="flex items-center justify-between">
                <span>Current Month Status</span>
                <Badge variant="default" className="text-lg px-4 py-1">
                  {currentStatus.tier_name} Tier
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Maker Volume
                  </p>
                  <p className="text-2xl font-bold">
                    ${currentStatus.maker_volume.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Qualifying Volume
                  </p>
                  <p className="text-2xl font-bold">
                    ${currentStatus.qualifying_volume.toLocaleString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Current Rate
                  </p>
                  <p className="text-2xl font-bold text-primary">
                    {currentStatus.rebate_rate_percent.toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground mb-1">
                    Est. Rebate
                  </p>
                  <p className="text-2xl font-bold text-emerald-600">
                    ${currentStatus.estimated_rebate.toFixed(2)}
                  </p>
                </div>
              </div>

              {currentStatus.available_to_claim > 0 && (
                <div className="mt-6 p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-xl border border-emerald-200 dark:border-emerald-800">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-emerald-800 dark:text-emerald-200">
                        Available to Claim
                      </p>
                      <p className="text-3xl font-black text-emerald-600">
                        ${currentStatus.available_to_claim.toFixed(2)}
                      </p>
                    </div>
                    <Button size="lg" className="gap-2">
                      <Zap className="w-4 h-4" />
                      Claim Now
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Tier Progression */}
        <div className="space-y-4">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5" />
            Rebate Tiers
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {tiers.map((tier) => (
              <TierCard
                key={tier.id}
                tier={tier}
                isCurrent={tier.id === currentTierId}
                isNext={tier.id === currentTierId + 1}
                currentVolume={currentVolume}
              />
            ))}
          </div>
        </div>

        {/* Spread Multipliers */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <h3 className="text-xl font-bold">Spread Multipliers</h3>
            <Tooltip>
              <TooltipTrigger>
                <Info className="w-4 h-4 text-muted-foreground" />
              </TooltipTrigger>
              <TooltipContent className="max-w-sm">
                <p>
                  Maintain tight spreads to earn bonus multipliers on your
                  rebates. Minimum 1-second resting time required.
                </p>
              </TooltipContent>
            </Tooltip>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {spreadMultipliers.map((config) => (
              <SpreadMultiplierCard
                key={config.id}
                config={config}
                isActive={config.spread_tier === 'elite'}
              />
            ))}
          </div>
        </div>

        {/* Calculator & History */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <RebateCalculator
            tiers={tiers}
            spreadMultipliers={spreadMultipliers}
          />

          {/* Rebate History */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5" />
                Rebate History
              </CardTitle>
            </CardHeader>
            <CardContent>
              {history.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>No rebates claimed yet</p>
                  <p className="text-sm">
                    Start placing maker orders to earn rebates!
                  </p>
                </div>
              ) : (
                <div className="space-y-3 max-h-[400px] overflow-auto">
                  {history.map((rebate) => (
                    <div
                      key={`${rebate.year_month}-${rebate.rebate_period_start}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">
                          {rebate.tier_name} • {rebate.year_month}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          ${rebate.qualifying_volume.toLocaleString()} volume
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-emerald-600">
                          ${rebate.net_rebate_amount.toFixed(2)}
                        </p>
                        <Badge
                          variant={
                            rebate.claim_status === 'paid'
                              ? 'default'
                              : rebate.claim_status === 'claimed'
                              ? 'secondary'
                              : 'outline'
                          }
                          className="text-xs"
                        >
                          {rebate.claim_status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Info Section */}
        <Card className="bg-muted/50">
          <CardContent className="p-6">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-primary/10">
                <Info className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h4 className="font-semibold mb-2">How Maker Rebates Work</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    Place limit orders that add liquidity to the order book
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    Orders must rest for minimum 1 second to qualify
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    Maintain tight spreads for bonus multipliers (up to 2x)
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    Rebates calculated weekly and distributed every Monday
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 text-green-500" />
                    Choose payment in USDC or platform tokens
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </TooltipProvider>
  );
}
