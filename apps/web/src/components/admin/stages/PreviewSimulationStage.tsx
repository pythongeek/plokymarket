'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Play,
  BarChart2,
  TrendingUp,
  Users,
  Clock,
  ArrowRight,
  ArrowLeft,
  RefreshCw,
  CheckCircle,
  ShieldOff,
  DollarSign,
  Activity,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { MarketDraft } from '@/lib/market-creation/service';

interface PreviewSimulationStageProps {
  draft: MarketDraft;
  onSave: (data: Record<string, any>) => Promise<boolean>;
  onBack?: () => void;
  isSaving: boolean;
  errors: string[];
  adminBypass?: { liquidity: boolean; legal_review: boolean; simulation: boolean };
}

interface SimulationResult {
  totalTrades: number;
  totalVolume: number;
  avgPrice: number;
  priceRange: [number, number];
  uniqueTraders: number;
  liquidityDepth: number;
  expectedFees: number;
  spreadPercent: number;
}

export function PreviewSimulationStage({
  draft,
  onSave,
  onBack,
  isSaving,
  errors,
  adminBypass
}: PreviewSimulationStageProps) {
  const isBypassed = adminBypass?.simulation || false;
  const [isRunning, setIsRunning] = useState(false);
  const [completed, setCompleted] = useState(!!draft?.simulation_results || isBypassed);
  const [results, setResults] = useState<SimulationResult | null>(
    draft?.simulation_results as SimulationResult | null
  );

  const runSimulation = async () => {
    setIsRunning(true);

    // Simulate delay
    await new Promise(resolve => setTimeout(resolve, 2000));

    const liquidity = draft?.liquidity_amount || draft?.liquidity_commitment || 1000;
    const fee = draft?.trading_fee_percent || 2;

    const simResults: SimulationResult = {
      totalTrades: Math.floor(Math.random() * 500) + 100,
      totalVolume: Math.floor(liquidity * (2 + Math.random() * 8)),
      avgPrice: Math.round((40 + Math.random() * 20) * 100) / 100,
      priceRange: [
        Math.round((10 + Math.random() * 20) * 100) / 100,
        Math.round((60 + Math.random() * 30) * 100) / 100
      ],
      uniqueTraders: Math.floor(Math.random() * 200) + 20,
      liquidityDepth: Math.round(liquidity * (1.5 + Math.random())),
      expectedFees: Math.round(liquidity * (fee / 100) * (2 + Math.random() * 5)),
      spreadPercent: Math.round((0.5 + Math.random() * 2) * 100) / 100
    };

    setResults(simResults);
    setIsRunning(false);
    setCompleted(true);
  };

  const handleSubmit = async () => {
    await onSave({
      simulation_config: {
        ran_at: new Date().toISOString(),
        bypassed: isBypassed
      },
      simulation_results: results || (isBypassed ? { bypassed: true } : null),
      admin_bypass_simulation: isBypassed
    });
  };

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
            <p className="text-sm font-medium text-amber-300">সিমুলেশন বাইপাস সক্রিয়</p>
            <p className="text-xs text-amber-400/70">
              সিমুলেশন এড়িয়ে যাওয়া হচ্ছে। আপনি এখনও ঐচ্ছিকভাবে চালাতে পারেন।
            </p>
          </div>
        </motion.div>
      )}

      {/* Market Preview */}
      <Card className="bg-slate-900/50 border-slate-700/50 p-4">
        <h4 className="text-sm font-semibold text-white mb-3">মার্কেট প্রিভিউ (Market Preview)</h4>
        <div className="bg-slate-800/50 rounded-lg p-4 space-y-3">
          <div className="flex items-center gap-3">
            {draft?.image_url && (
              <div className="w-12 h-12 rounded-lg overflow-hidden border border-slate-700 flex-shrink-0">
                <img src={draft.image_url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div>
              <p className="text-white font-medium">{draft?.question || 'N/A'}</p>
              <div className="flex gap-2 mt-1">
                <Badge className="bg-slate-700/50 text-slate-300 text-xs">{draft?.category}</Badge>
                <Badge className="bg-slate-700/50 text-slate-300 text-xs">{draft?.market_type}</Badge>
              </div>
            </div>
          </div>
          {draft?.description && (
            <p className="text-xs text-slate-400">{draft.description}</p>
          )}
        </div>
      </Card>

      {/* Simulation Controls */}
      {!completed && (
        <div className="text-center py-8">
          <div className="w-20 h-20 mx-auto bg-slate-800 rounded-full flex items-center justify-center mb-4">
            {isRunning ? (
              <RefreshCw className="w-10 h-10 text-primary animate-spin" />
            ) : (
              <Play className="w-10 h-10 text-primary" />
            )}
          </div>
          <h3 className="text-white font-semibold mb-2">
            {isRunning ? 'সিমুলেশন চলছে...' : 'সিমুলেশন চালান'}
          </h3>
          <p className="text-sm text-slate-400 mb-4">
            ভার্চুয়াল ট্রেডিং ডেটা দিয়ে মার্কেটের কার্যকারিতা পরীক্ষা করুন
          </p>
          {!isRunning && (
            <Button onClick={runSimulation} size="lg">
              <Play className="w-4 h-4 mr-2" />
              সিমুলেশন শুরু করুন
            </Button>
          )}
        </div>
      )}

      {/* Simulation Results */}
      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-semibold text-white flex items-center gap-2">
              <BarChart2 className="w-4 h-4 text-green-400" />
              সিমুলেশন ফলাফল
            </h4>
            <Button variant="ghost" size="sm" onClick={runSimulation} className="text-slate-400 hover:text-white">
              <RefreshCw className="w-3 h-3 mr-1" />
              পুনরায় চালান
            </Button>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Card className="bg-slate-800/50 border-slate-700/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Activity className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-slate-400">মোট ট্রেড</span>
              </div>
              <p className="text-xl font-bold text-white">{results.totalTrades}</p>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <DollarSign className="w-4 h-4 text-green-400" />
                <span className="text-xs text-slate-400">মোট ভলিউম</span>
              </div>
              <p className="text-xl font-bold text-white">${results.totalVolume.toLocaleString()}</p>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-violet-400" />
                <span className="text-xs text-slate-400">ট্রেডার</span>
              </div>
              <p className="text-xl font-bold text-white">{results.uniqueTraders}</p>
            </Card>
            <Card className="bg-slate-800/50 border-slate-700/50 p-3">
              <div className="flex items-center gap-2 mb-1">
                <TrendingUp className="w-4 h-4 text-amber-400" />
                <span className="text-xs text-slate-400">প্রত্যাশিত ফি</span>
              </div>
              <p className="text-xl font-bold text-white">${results.expectedFees.toLocaleString()}</p>
            </Card>
          </div>

          <Card className="bg-slate-800/50 border-slate-700/50 p-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div>
                <span className="text-slate-400">গড় মূল্য:</span>
                <span className="text-white ml-2">{results.avgPrice}¢</span>
              </div>
              <div>
                <span className="text-slate-400">মূল্য সীমা:</span>
                <span className="text-white ml-2">{results.priceRange[0]}¢ — {results.priceRange[1]}¢</span>
              </div>
              <div>
                <span className="text-slate-400">তারল্য গভীরতা:</span>
                <span className="text-white ml-2">${results.liquidityDepth.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-slate-400">স্প্রেড:</span>
                <span className="text-white ml-2">{results.spreadPercent}%</span>
              </div>
            </div>
          </Card>

          <div className="flex items-center gap-2 text-green-400">
            <CheckCircle className="w-4 h-4" />
            <span className="text-sm">সিমুলেশন সফলভাবে সম্পন্ন হয়েছে</span>
          </div>
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
          disabled={isSaving || (!completed && !isBypassed)}
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
