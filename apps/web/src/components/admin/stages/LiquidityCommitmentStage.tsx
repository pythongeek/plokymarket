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
  TrendingUp
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
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
}

const MIN_LIQUIDITY = 1000;
const RECOMMENDED_LIQUIDITY = 5000;

export function LiquidityCommitmentStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors
}: LiquidityCommitmentStageProps) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState(draft.liquidity_commitment || MIN_LIQUIDITY);
  const [isDeposited, setIsDeposited] = useState(draft.liquidity_deposited || false);
  const [txHash, setTxHash] = useState('');
  const [showDepositForm, setShowDepositForm] = useState(false);

  const handleSubmit = async () => {
    if (!isDeposited) {
      setShowDepositForm(true);
      return;
    }

    await onSave({
      liquidity_commitment: amount,
      liquidity_deposited: true,
      liquidity_tx_hash: txHash
    });
  };

  const handleSimulateDeposit = () => {
    // Simulate deposit for demo purposes
    setTxHash('0x' + Array(64).fill(0).map(() => Math.floor(Math.random() * 16).toString(16)).join(''));
    setIsDeposited(true);
    setShowDepositForm(false);
  };

  const getLiquidityTier = (value: number) => {
    if (value >= 10000) return { name: 'Platinum', color: 'text-purple-500', benefits: ['Priority listing', 'Featured badge', 'Reduced fees'] };
    if (value >= 5000) return { name: 'Gold', color: 'text-yellow-500', benefits: ['Featured badge', 'Reduced fees'] };
    if (value >= 2000) return { name: 'Silver', color: 'text-gray-400', benefits: ['Reduced fees'] };
    return { name: 'Bronze', color: 'text-amber-600', benefits: ['Standard listing'] };
  };

  const tier = getLiquidityTier(amount);

  return (
    <div className="space-y-6">
      {/* Info Header */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <div className="flex gap-3">
          <Info className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="font-medium text-blue-900 dark:text-blue-100">
              Liquidity Commitment Required
            </p>
            <p className="text-sm text-blue-700 dark:text-blue-300 mt-1">
              Creators must commit a minimum of ${MIN_LIQUIDITY.toLocaleString()} in liquidity 
              to ensure sufficient market depth. This liquidity will be returned when the market resolves.
            </p>
          </div>
        </div>
      </div>

      {/* Amount Selection */}
      <div className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-lg font-medium">
              Liquidity Amount
            </Label>
            <div className="text-right">
              <span className="text-3xl font-bold">${amount.toLocaleString()}</span>
              <span className="text-sm text-muted-foreground ml-1">USDC</span>
            </div>
          </div>

          <Slider
            value={[amount]}
            onValueChange={([v]) => setAmount(v)}
            min={MIN_LIQUIDITY}
            max={50000}
            step={100}
            className="py-4"
          />

          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Min: ${MIN_LIQUIDITY.toLocaleString()}</span>
            <span>Recommended: ${RECOMMENDED_LIQUIDITY.toLocaleString()}</span>
            <span>Max: $50,000</span>
          </div>
        </div>

        {/* Quick Select */}
        <div className="flex gap-2">
          {[1000, 2500, 5000, 10000, 25000].map((value) => (
            <button
              key={value}
              onClick={() => setAmount(value)}
              className={cn(
                "px-4 py-2 rounded-lg text-sm font-medium transition-all",
                amount === value
                  ? "bg-primary text-primary-foreground"
                  : "bg-gray-100 dark:bg-gray-800 hover:bg-gray-200"
              )}
            >
              ${(value / 1000)}K
            </button>
          ))}
        </div>

        {/* Tier Benefits */}
        <motion.div
          key={tier.name}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "p-4 rounded-xl border-2",
            tier.name === 'Platinum' ? 'border-purple-200 bg-purple-50 dark:bg-purple-900/20' :
            tier.name === 'Gold' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-900/20' :
            tier.name === 'Silver' ? 'border-gray-200 bg-gray-50 dark:bg-gray-800/50' :
            'border-amber-200 bg-amber-50 dark:bg-amber-900/20'
          )}
        >
          <div className="flex items-center gap-3 mb-3">
            <TrendingUp className={cn("w-6 h-6", tier.color)} />
            <div>
              <p className={cn("font-bold text-lg", tier.color)}>{tier.name} Tier</p>
              <p className="text-sm text-muted-foreground">
                With ${amount.toLocaleString()} commitment
              </p>
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-sm font-medium">Benefits:</p>
            <ul className="text-sm text-muted-foreground space-y-1">
              {tier.benefits.map((benefit, i) => (
                <li key={i} className="flex items-center gap-2">
                  <Check className="w-3 h-3 text-green-500" />
                  {benefit}
                </li>
              ))}
            </ul>
          </div>
        </motion.div>

        {/* Commitment Info */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Lock className="w-8 h-8 text-primary" />
              <div>
                <p className="font-medium">Locked Until Resolution</p>
                <p className="text-xs text-muted-foreground">
                  Funds locked until market resolves
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Unlock className="w-8 h-8 text-green-500" />
              <div>
                <p className="font-medium">Fully Refundable</p>
                <p className="text-xs text-muted-foreground">
                  Get liquidity back after resolution
                </p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Clock className="w-8 h-8 text-blue-500" />
              <div>
                <p className="font-medium">24h Funding Window</p>
                <p className="text-xs text-muted-foreground">
                  Auto-cancel if unfunded
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Deposit Status */}
      {isDeposited ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <p className="font-medium text-green-900 dark:text-green-100">
                Liquidity Deposited
              </p>
              <p className="text-sm text-green-700 dark:text-green-300 font-mono">
                TX: {txHash.slice(0, 20)}...{txHash.slice(-8)}
              </p>
            </div>
            <Badge variant="default" className="bg-green-500">Confirmed</Badge>
          </div>
        </motion.div>
      ) : showDepositForm ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gray-50 dark:bg-gray-800/50 rounded-lg p-6 space-y-4"
        >
          <h4 className="font-medium">Deposit Liquidity</h4>
          <p className="text-sm text-muted-foreground">
            Transfer ${amount.toLocaleString()} USDC to the market creation contract.
          </p>
          <div className="space-y-2">
            <Label>Transaction Hash (after deposit)</Label>
            <Input
              placeholder="0x..."
              value={txHash}
              onChange={(e) => setTxHash(e.target.value)}
            />
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setShowDepositForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSimulateDeposit} className="flex-1">
              Confirm Deposit
            </Button>
          </div>
          <p className="text-xs text-muted-foreground text-center">
            (Demo mode: Click "Confirm Deposit" to simulate)
          </p>
        </motion.div>
      ) : null}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <Button variant="outline" onClick={onBack} disabled={isSaving}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <Button 
          onClick={handleSubmit} 
          disabled={isSaving || (showDepositForm && !txHash)}
          size="lg"
        >
          {isSaving ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
              Processing...
            </>
          ) : isDeposited ? (
            <>
              Continue
              <ArrowRight className="w-4 h-4 ml-2" />
            </>
          ) : (
            <>
              <Wallet className="w-4 h-4 mr-2" />
              Deposit Liquidity
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
