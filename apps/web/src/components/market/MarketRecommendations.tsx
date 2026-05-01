'use client';

/**
 * MarketRecommendations Component
 * Phase 4 - AI-powered market recommendations with Bengali language support
 * Displays personalized market suggestions based on user preferences and market trends
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  TrendingUp, 
  TrendingDown, 
  Flame, 
  Clock, 
  Sparkles,
  ChevronRight,
  Star,
  BarChart3,
  Zap,
  Target,
  Eye,
  EyeOff
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { formatCompactNumber } from '@/lib/utils/format';
import type { UnifiedEvent } from '@/types/unified';

// ===================================
// TYPES
// ===================================

export interface MarketRecommendation {
  event: UnifiedEvent;
  score: number;
  reasons: RecommendationReason[];
  predictedTrend: 'up' | 'down' | 'stable';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  timeHorizon: 'short' | 'medium' | 'long';
}

export interface RecommendationReason {
  type: 'volume_surge' | 'price_movement' | 'trending' | 'expert_pick' | 'following' | 'similar_history';
  label: string;
  labelBn: string;
  icon: React.ReactNode;
  weight: number;
}

interface MarketRecommendationsProps {
  userId?: string;
  limit?: number;
  showTabs?: boolean;
  className?: string;
  onMarketClick?: (marketId: string) => void;
}

// ===================================
// SKELETON
// ===================================

function RecommendationSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map((i) => (
        <div key={i} className="flex items-start gap-3 p-3 rounded-lg border">
          <Skeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-3 w-1/2" />
            <div className="flex gap-2">
              <Skeleton className="h-5 w-16" />
              <Skeleton className="h-5 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ===================================
// COMPONENT
// ===================================

export function MarketRecommendations({
  userId,
  limit = 5,
  showTabs = true,
  className,
  onMarketClick
}: MarketRecommendationsProps) {
  const { t, i18n } = useTranslation();
  const [activeTab, setActiveTab] = useState<'personalized' | 'trending' | 'volume'>('personalized');
  const [recommendations, setRecommendations] = useState<MarketRecommendation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hiddenMarkets, setHiddenMarkets] = useState<Set<string>>(new Set());

  const isBengali = i18n.language === 'bn';

  // ──────────────────────────────────────
  // FETCH RECOMMENDATIONS
  // ──────────────────────────────────────

  useEffect(() => {
    const fetchRecommendations = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For now, we'll fetch markets and calculate recommendations client-side
        // In production, this would call an AI-powered API endpoint
        const response = await fetch(`/api/markets/recommendations?tab=${activeTab}&limit=${limit}&userId=${userId || ''}`);
        
        if (!response.ok) {
          throw new Error('Failed to fetch recommendations');
        }

        const data = await response.json();
        setRecommendations(data.recommendations || []);
      } catch (err) {
        console.error('Error fetching recommendations:', err);
        // Fallback: generate mock recommendations for demo
        setRecommendations(generateMockRecommendations(limit));
      } finally {
      setIsLoading(false);
      }
    };

    fetchRecommendations();
  }, [activeTab, userId, limit]);

  // ──────────────────────────────────────
  // FILTER HIDDEN
  // ──────────────────────────────────────

  const visibleRecommendations = useMemo(() => {
    return recommendations
      .filter(r => !hiddenMarkets.has(r.event.id))
      .slice(0, limit);
  }, [recommendations, hiddenMarkets, limit]);

  // ──────────────────────────────────────
  // HIDE MARKET
  // ──────────────────────────────────────

  const hideMarket = (marketId: string) => {
    setHiddenMarkets(prev => new Set([...prev, marketId]));
  };

  // ──────────────────────────────────────
  // REASON ICONS & LABELS
  // ──────────────────────────────────────

  const getReasonConfig = (reason: RecommendationReason) => {
    const configs: Record<string, { color: string; bgColor: string }> = {
      volume_surge: { color: 'text-blue-600', bgColor: 'bg-blue-100 dark:bg-blue-900/30' },
      price_movement: { color: 'text-green-600', bgColor: 'bg-green-100 dark:bg-green-900/30' },
      trending: { color: 'text-orange-600', bgColor: 'bg-orange-100 dark:bg-orange-900/30' },
      expert_pick: { color: 'text-purple-600', bgColor: 'bg-purple-100 dark:bg-purple-900/30' },
      following: { color: 'text-pink-600', bgColor: 'bg-pink-100 dark:bg-pink-900/30' },
      similar_history: { color: 'text-cyan-600', bgColor: 'bg-cyan-100 dark:bg-cyan-900/30' },
    };
    return configs[reason.type] || configs.similar_history;
  };

  // ──────────────────────────────────────
  // RISK BADGE
  // ──────────────────────────────────────

  const getRiskBadge = (risk: 'low' | 'medium' | 'high') => {
    const configs = {
      low: { 
        label: isBengali ? 'নিম্ন ঝুঁকি' : 'Low Risk',
        className: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      },
      medium: { 
        label: isBengali ? 'মধ্যম ঝুঁকি' : 'Medium Risk',
        className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      },
      high: { 
        label: isBengali ? 'উচ্চ ঝুঁকি' : 'High Risk',
        className: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
      },
    };
    return configs[risk];
  };

  // ──────────────────────────────────────
  // TIME HORIZON
  // ──────────────────────────────────────

  const getTimeHorizonLabel = (horizon: 'short' | 'medium' | 'long') => {
    const labels = {
      short: { en: 'Short term', bn: 'স্বল্পমেয়াদী' },
      medium: { en: 'Medium term', bn: 'মধ্যমেয়াদী' },
      long: { en: 'Long term', bn: 'দীর্ঘমেয়াদী' },
    };
    return labels[horizon][isBengali ? 'bn' : 'en'];
  };

  // ──────────────────────────────────────
  // RENDER
  // ──────────────────────────────────────

  if (error) {
    return (
      <Card className={className}>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {isBengali ? 'সুপারিশ লোড করতে ব্যর্থ' : 'Failed to load recommendations'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => setActiveTab(activeTab)}>
            {isBengali ? 'আবার চেষ্টা করুন' : 'Retry'}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn('overflow-hidden', className)}>
      {/* Header */}
      <CardHeader className="pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Sparkles className="h-5 w-5 text-primary" />
            {isBengali ? 'বাজার সুপারিশ' : 'Market Recommendations'}
          </CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <BarChart3 className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>{isBengali ? 'AI-চালিত সুপারিশ' : 'AI-powered recommendations'}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>

        {/* Tabs */}
        {showTabs && (
          <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)}>
            <TabsList className="grid w-full grid-cols-3 h-9">
              <TabsTrigger value="personalized" className="text-xs sm:text-sm">
                <Sparkles className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">
                  {isBengali ? 'ব্যক্তিগত' : 'For You'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="trending" className="text-xs sm:text-sm">
                <Flame className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">
                  {isBengali ? 'ট্রেন্ডিং' : 'Trending'}
                </span>
              </TabsTrigger>
              <TabsTrigger value="volume" className="text-xs sm:text-sm">
                <BarChart3 className="h-3 w-3 mr-1" />
                <span className="hidden sm:inline">
                  {isBengali ? 'ভলিউম' : 'Volume'}
                </span>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        )}
      </CardHeader>

      {/* Content */}
      <CardContent className="space-y-3">
        {isLoading ? (
          <RecommendationSkeleton />
        ) : visibleRecommendations.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-50" />
            <p>{isBengali ? 'কোনো সুপারিশ পাওয়া যায়নি' : 'No recommendations available'}</p>
            <p className="text-sm mt-1">
              {isBengali ? 'আবার চেষ্টা করতে ট্যাব পরিবর্তন করুন' : 'Try changing tabs for more suggestions'}
            </p>
          </div>
        ) : (
          <AnimatePresence mode="popLayout">
            {visibleRecommendations.map((rec, index) => (
              <RecommendationItem
                key={rec.event.id}
                recommendation={rec}
                index={index}
                isBengali={isBengali}
                onHide={hideMarket}
                onClick={onMarketClick}
                getReasonConfig={getReasonConfig}
                getRiskBadge={getRiskBadge}
                getTimeHorizonLabel={getTimeHorizonLabel}
              />
            ))}
          </AnimatePresence>
        )}

        {/* View More */}
        {!isLoading && visibleRecommendations.length > 0 && (
          <div className="pt-2 border-t">
            <Button variant="ghost" className="w-full" asChild>
              <Link href="/markets?tab=recommendations">
                {isBengali ? 'সব সুপারিশ দেখুন' : 'View All Recommendations'}
                <ChevronRight className="h-4 w-4 ml-1" />
              </Link>
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ===================================
// RECOMMENDATION ITEM
// ===================================

interface RecommendationItemProps {
  recommendation: MarketRecommendation;
  index: number;
  isBengali: boolean;
  onHide: (marketId: string) => void;
  onClick?: (marketId: string) => void;
  getReasonConfig: (reason: RecommendationReason) => { color: string; bgColor: string };
  getRiskBadge: (risk: 'low' | 'medium' | 'high') => { label: string; className: string };
  getTimeHorizonLabel: (horizon: 'short' | 'medium' | 'long') => string;
}

function RecommendationItem({
  recommendation,
  index,
  isBengali,
  onHide,
  onClick,
  getReasonConfig,
  getRiskBadge,
  getTimeHorizonLabel
}: RecommendationItemProps) {
  const { event, score, reasons, predictedTrend, confidence, riskLevel, timeHorizon } = recommendation;
  const [showDetails, setShowDetails] = useState(false);

  const yesPrice = event.current_yes_price || 0.5;
  const volume = event.total_volume || event.volume || 0;

  const trendIcon = predictedTrend === 'up' 
    ? <TrendingUp className="h-4 w-4 text-green-500" />
    : predictedTrend === 'down'
    ? <TrendingDown className="h-4 w-4 text-red-500" />
    : <BarChart3 className="h-4 w-4 text-gray-500" />;

  const trendLabel = predictedTrend === 'up' 
    ? (isBengali ? 'উর্ধ্বমুখী' : 'Bullish')
    : predictedTrend === 'down'
    ? (isBengali ? 'নিম্নমুখী' : 'Bearish')
    : (isBengali ? 'স্থিতিশীল' : 'Stable');

  const riskBadge = getRiskBadge(riskLevel);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -100 }}
      transition={{ duration: 0.2, delay: index * 0.05 }}
    >
      <Link 
        href={`/markets/${event.id}`}
        className="block group"
        onClick={() => onClick?.(event.id)}
      >
        <div className="relative p-3 rounded-lg border bg-card hover:bg-accent/50 transition-colors">
          {/* Score Badge */}
          <div className="absolute -top-2 -right-2 flex items-center gap-1">
            <Badge 
              variant="secondary" 
              className="text-xs font-medium px-1.5 py-0.5"
            >
              <Star className="h-3 w-3 mr-0.5 fill-current" />
              {(score * 100).toFixed(0)}
            </Badge>
          </div>

          {/* Main Content */}
          <div className="flex items-start gap-3">
            {/* Trend Indicator */}
            <div className={cn(
              'flex items-center justify-center h-10 w-10 rounded-full shrink-0',
              predictedTrend === 'up' ? 'bg-green-100 dark:bg-green-900/30' :
              predictedTrend === 'down' ? 'bg-red-100 dark:bg-red-900/30' :
              'bg-gray-100 dark:bg-gray-800'
            )}>
              {trendIcon}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Title */}
              <h4 className="font-medium text-sm line-clamp-2 group-hover:text-primary transition-colors">
                {event.name || event.title || event.question}
              </h4>

              {/* Price & Volume */}
              <div className="flex items-center gap-3 mt-1.5">
                <span className="text-lg font-bold text-green-600 dark:text-green-500">
                  ৳{(yesPrice * 100).toFixed(1)}
                </span>
                <span className="text-xs text-muted-foreground">
                  {isBengali ? 'ভলিউম:' : 'Vol:'} ৳{formatCompactNumber(volume)}
                </span>
                <span className={cn(
                  'text-xs font-medium px-1.5 py-0.5 rounded',
                  predictedTrend === 'up' ? 'text-green-600 bg-green-100 dark:bg-green-900/30' :
                  predictedTrend === 'down' ? 'text-red-600 bg-red-100 dark:bg-red-900/30' :
                  'text-gray-600 bg-gray-100 dark:bg-gray-800'
                )}>
                  {trendLabel}
                </span>
              </div>

              {/* Reasons */}
              <div className="flex flex-wrap gap-1.5 mt-2">
                {reasons.slice(0, 3).map((reason, i) => (
                  <span
                    key={i}
                    className={cn(
                      'inline-flex items-center gap-1 text-xs px-1.5 py-0.5 rounded-full',
                      getReasonConfig(reason).bgColor,
                      getReasonConfig(reason).color
                    )}
                  >
                    {reason.icon}
                    {isBengali ? reason.labelBn : reason.label}
                  </span>
                ))}
              </div>

              {/* Expanded Details */}
              {showDetails && (
                <div className="mt-3 pt-3 border-t space-y-2">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {isBengali ? 'আত্মবিশ্বাস:' : 'Confidence:'}
                    </span>
                    <span className="font-medium">{(confidence * 100).toFixed(0)}%</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {isBengali ? 'সময়সীমা:' : 'Time Horizon:'}
                    </span>
                    <span className="font-medium">{getTimeHorizonLabel(timeHorizon)}</span>
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">
                      {isBengali ? 'ঝুঁকি স্তর:' : 'Risk Level:'}
                    </span>
                    <span className={cn('text-xs px-1.5 py-0.5 rounded font-medium', riskBadge.className)}>
                      {riskBadge.label}
                    </span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="flex items-center gap-2 mt-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs"
                  onClick={(e) => {
                    e.preventDefault();
                    setShowDetails(!showDetails);
                  }}
                >
                  <Target className="h-3 w-3 mr-1" />
                  {showDetails 
                    ? (isBengali ? 'কম দেখুন' : 'Show Less')
                    : (isBengali ? 'আরো দেখুন' : 'Show More')
                  }
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 text-xs text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.preventDefault();
                    onHide(event.id);
                  }}
                >
                  <EyeOff className="h-3 w-3 mr-1" />
                  {isBengali ? 'লুকান' : 'Hide'}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}

// ===================================
// MOCK DATA GENERATOR
// ===================================

function generateMockRecommendations(count: number): MarketRecommendation[] {
  const mockEvents: Partial<UnifiedEvent>[] = [
    { id: '1', name: 'বাংলাদেশ বনাম ভারত ক্রিকেট ম্যাচে জয়', question: 'Will Bangladesh win the cricket match?', category: 'Sports', total_volume: 150000, current_yes_price: 0.65, status: 'active' },
    { id: '2', name: 'আজকের ডলার রেট ১১০ টাকার উপরে', question: 'Will USD rate be above 110 BDT today?', category: 'Economics', total_volume: 85000, current_yes_price: 0.45, status: 'active' },
    { id: '3', name: 'বিটকয়েন এই সপ্তাহে $100,000 ছুঁবে', question: 'Will Bitcoin reach $100k this week?', category: 'Crypto', total_volume: 250000, current_yes_price: 0.35, status: 'active' },
    { id: '4', name: 'ঢাকায় আজ বৃষ্টি হবে', question: 'Will it rain in Dhaka today?', category: 'Weather', total_volume: 45000, current_yes_price: 0.55, status: 'active' },
    { id: '5', name: 'প্রধানমন্ত্রী এই মাসে ভারত সফর করবেন', question: 'Will PM visit India this month?', category: 'Politics', total_volume: 120000, current_yes_price: 0.70, status: 'active' },
  ];

  const reasonTypes: RecommendationReason['type'][] = ['volume_surge', 'price_movement', 'trending', 'expert_pick', 'following', 'similar_history'];
  const reasonsBn: Record<string, string> = {
    volume_surge: 'ভলিউম বৃদ্ধি',
    price_movement: 'মূল্য চলাচল',
    trending: 'ট্রেন্ডিং',
    expert_pick: 'বিশেষজ্ঞ পছন্দ',
    following: 'অনুসরণ',
    similar_history: 'অনুরূপ ইতিহাস',
  };
  const reasonsEn: Record<string, string> = {
    volume_surge: 'Volume Surge',
    price_movement: 'Price Movement',
    trending: 'Trending',
    expert_pick: 'Expert Pick',
    following: 'Following',
    similar_history: 'Similar History',
  };

  return mockEvents.slice(0, count).map((event, i) => {
    const numReasons = Math.floor(Math.random() * 3) + 2;
    const reasons: RecommendationReason[] = [];
    
    for (let j = 0; j < numReasons; j++) {
      const type = reasonTypes[(i + j) % reasonTypes.length];
      reasons.push({
        type,
        label: reasonsEn[type],
        labelBn: reasonsBn[type],
        icon: type === 'volume_surge' ? <BarChart3 className="h-3 w-3" /> :
              type === 'price_movement' ? <TrendingUp className="h-3 w-3" /> :
              type === 'trending' ? <Flame className="h-3 w-3" /> :
              type === 'expert_pick' ? <Star className="h-3 w-3" /> :
              type === 'following' ? <Eye className="h-3 w-3" /> :
              <Zap className="h-3 w-3" />,
        weight: 0.5 + Math.random() * 0.5,
      });
    }

    const trends: ('up' | 'down' | 'stable')[] = ['up', 'down', 'stable'];
    const risks: ('low' | 'medium' | 'high')[] = ['low', 'medium', 'high'];
    const horizons: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long'];

    return {
      event: event as UnifiedEvent,
      score: 0.6 + Math.random() * 0.4,
      reasons,
      predictedTrend: trends[i % 3],
      confidence: 0.5 + Math.random() * 0.5,
      riskLevel: risks[i % 3],
      timeHorizon: horizons[i % 3],
    };
  });
}

export default MarketRecommendations;
