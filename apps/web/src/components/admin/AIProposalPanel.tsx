'use client';

/**
 * AI Market Proposal Panel
 * Displays AI-generated market proposals for admin approval
 * Allows one-click atomic creation
 */

import React, { useState } from 'react';
import { 
  Sparkles, 
  Check, 
  X, 
  TrendingUp, 
  DollarSign, 
  Users,
  Loader2,
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Plus
} from 'lucide-react';
import { ProposedMarket, MarketProposalResult } from '@/lib/ai-agents/market-proposal-agent';
import { cn } from '@/lib/utils';

interface AIProposalPanelProps {
  proposals: MarketProposalResult | null;
  isLoading: boolean;
  error: string | null;
  onApprove: (markets: ProposedMarket[]) => void;
  onReject: () => void;
  onRegenerate: () => void;
  className?: string;
}

const marketTypeLabels: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  binary: { 
    label: 'বাইনারি (হ্যাঁ/না)', 
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: <div className="w-4 h-4 rounded-full bg-blue-500" />
  },
  categorical: { 
    label: 'ক্যাটেগরিকাল (একাধিক)', 
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: <div className="w-4 h-4 rounded bg-purple-500" />
  },
  scalar: { 
    label: 'স্কেলার (সংখ্যা)', 
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: <div className="w-4 h-1 rounded bg-amber-500" />
  },
};

export const AIProposalPanel: React.FC<AIProposalPanelProps> = ({
  proposals,
  isLoading,
  error,
  onApprove,
  onReject,
  onRegenerate,
  className,
}) => {
  const [selectedMarkets, setSelectedMarkets] = useState<Set<string>>(new Set());
  const [expandedMarkets, setExpandedMarkets] = useState<Set<string>>(new Set(['primary']));
  const [editedLiquidity, setEditedLiquidity] = useState<Record<string, number>>({});

  if (isLoading) {
    return (
      <div className={cn(
        "bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200 rounded-xl p-6",
        className
      )}>
        <div className="flex items-center justify-center gap-3 py-8">
          <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
          <span className="text-indigo-700 font-medium">AI মার্কেট বিশ্লেষণ করছে...</span>
        </div>
        <div className="space-y-3">
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-3/4" />
          <div className="h-4 bg-indigo-100 rounded animate-pulse w-1/2" />
          <div className="h-20 bg-indigo-100 rounded animate-pulse" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(
        "bg-red-50 border border-red-200 rounded-xl p-6",
        className
      )}>
        <div className="flex items-center gap-2 text-red-700 mb-3">
          <AlertCircle className="h-5 w-5" />
          <span className="font-medium">AI Proposal Error</span>
        </div>
        <p className="text-sm text-red-600 mb-4">{error}</p>
        <button
          onClick={onRegenerate}
          className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm"
        >
          আবার চেষ্টা করুন
        </button>
      </div>
    );
  }

  if (!proposals) {
    return null;
  }

  const allMarkets = [proposals.primaryMarket, ...proposals.secondaryMarkets];
  
  const toggleMarket = (id: string) => {
    const newSelected = new Set(selectedMarkets);
    if (newSelected.has(id)) {
      newSelected.delete(id);
    } else {
      newSelected.add(id);
    }
    setSelectedMarkets(newSelected);
  };

  const toggleExpand = (id: string) => {
    const newExpanded = new Set(expandedMarkets);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedMarkets(newExpanded);
  };

  const handleApprove = () => {
    const marketsToCreate = allMarkets
      .filter(m => selectedMarkets.has(m.id))
      .map(m => ({
        ...m,
        suggestedLiquidity: editedLiquidity[m.id] || m.suggestedLiquidity,
      }));
    onApprove(marketsToCreate);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('bn-BD', {
      style: 'currency',
      currency: 'BDT',
      maximumFractionDigits: 0,
    }).format(amount).replace('BDT', '৳');
  };

  return (
    <div className={cn(
      "bg-white border border-indigo-200 rounded-xl overflow-hidden shadow-lg",
      className
    )}>
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-white" />
            <h3 className="text-white font-bold">AI মার্কেট প্রস্তাবনা</h3>
          </div>
          <span className="text-xs bg-white/20 text-white px-2 py-1 rounded-full">
            {proposals.provider.toUpperCase()}
          </span>
        </div>
        <p className="text-indigo-100 text-sm mt-1">
          {allMarkets.length}টি মার্কেট প্রস্তাবিত • মোট লিকুইডিটি: {formatCurrency(proposals.totalSuggestedLiquidity)}
        </p>
      </div>

      {/* Market List */}
      <div className="divide-y divide-gray-100">
        {allMarkets.map((market, index) => {
          const isSelected = selectedMarkets.has(market.id);
          const isExpanded = expandedMarkets.has(market.id);
          const typeInfo = marketTypeLabels[market.type];
          const isPrimary = index === 0;

          return (
            <div
              key={market.id}
              className={cn(
                "p-4 transition-colors",
                isSelected ? "bg-indigo-50/50" : "hover:bg-gray-50",
                isPrimary && "border-l-4 border-l-indigo-500"
              )}
            >
              {/* Market Header */}
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={isSelected}
                  onChange={() => toggleMarket(market.id)}
                  className="mt-1 w-4 h-4 text-indigo-600 rounded focus:ring-indigo-500"
                />
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900">
                      {market.name}
                    </span>
                    {isPrimary && (
                      <span className="text-[10px] bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded">
                        প্রাইমারি
                      </span>
                    )}
                    <span className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded border flex items-center gap-1",
                      typeInfo.color
                    )}>
                      {typeInfo.icon}
                      {typeInfo.label}
                    </span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mt-1 line-clamp-2">
                    {market.question}
                  </p>

                  {/* Quick Stats */}
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                    <span className="flex items-center gap-1">
                      <DollarSign className="h-3 w-3" />
                      {formatCurrency(editedLiquidity[market.id] || market.suggestedLiquidity)}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="h-3 w-3" />
                      {market.outcomes.length} আউটকাম
                    </span>
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      {(market.tradingFee * 100).toFixed(1)}% ফি
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => toggleExpand(market.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4 text-gray-400" />
                  ) : (
                    <ChevronDown className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="mt-4 pl-7 space-y-4">
                  {/* Description */}
                  <div>
                    <label className="text-xs font-medium text-gray-500">বিবরণ</label>
                    <p className="text-sm text-gray-700 mt-1">{market.description}</p>
                  </div>

                  {/* Outcomes */}
                  <div>
                    <label className="text-xs font-medium text-gray-500">আউটকামসমূহ</label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {market.outcomes.map((outcome, i) => (
                        <span
                          key={i}
                          className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded-full"
                        >
                          {outcome}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Liquidity Edit */}
                  <div>
                    <label className="text-xs font-medium text-gray-500">লিকুইডিটি (BDT)</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="number"
                        value={editedLiquidity[market.id] || market.suggestedLiquidity}
                        onChange={(e) => setEditedLiquidity({
                          ...editedLiquidity,
                          [market.id]: parseInt(e.target.value) || 0
                        })}
                        className="w-32 px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-indigo-500"
                        min={1000}
                        step={1000}
                      />
                      <span className="text-xs text-gray-500">
                        প্রস্তাবিত: {formatCurrency(market.suggestedLiquidity)}
                      </span>
                    </div>
                  </div>

                  {/* AI Reasoning */}
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <label className="text-xs font-medium text-gray-500">AI বিশ্লেষণ</label>
                    <p className="text-sm text-gray-600 mt-1">{market.reasoning}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <div className="flex-1 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-indigo-500 rounded-full"
                          style={{ width: `${market.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-xs text-gray-500">
                        {Math.round(market.confidence * 100)}% কনফিডেন্স
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer Actions */}
      <div className="p-4 bg-gray-50 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-600">
            {selectedMarkets.size}টি মার্কেট নির্বাচিত
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onReject}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-100 text-sm font-medium"
            >
              <X className="h-4 w-4 inline mr-1" />
              বাতিল
            </button>
            <button
              onClick={onRegenerate}
              className="px-4 py-2 border border-indigo-300 text-indigo-700 rounded-lg hover:bg-indigo-50 text-sm font-medium"
            >
              <Sparkles className="h-4 w-4 inline mr-1" />
              আবার জেনারেট
            </button>
            <button
              onClick={handleApprove}
              disabled={selectedMarkets.size === 0}
              className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
            >
              <Check className="h-4 w-4 inline mr-1" />
              তৈরি করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIProposalPanel;
