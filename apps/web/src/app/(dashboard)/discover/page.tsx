"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
  TrendingUp,
  TrendingDown,
  Users,
  BarChart3,
  Sparkles,
  RefreshCw,
  ChevronRight,
  UserPlus,
  Eye,
  Clock,
  Flame,
  ArrowUpRight,
  Loader2
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { FollowButton } from '@/components/social/FollowButton';
import { ActivityFeed } from '@/components/social/ActivityFeed';

interface TrendingMarket {
  market_id: string;
  question: string;
  volume_24h: number;
  price_movement: number;
  probability: number;
  category: string;
  trending_score: number;
}

interface FeaturedTrader {
  user_id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  reputation_score: number;
  accuracy_tier: string;
  total_predictions: number;
  is_followed?: boolean;
}

interface SuggestedUser {
  user_id: string;
  full_name: string;
  username?: string;
  avatar_url?: string;
  bio?: string;
  mutual_followers: number;
  reason: 'similar_trades' | 'trending' | 'expert' | 'mutual_connection';
}

interface DiscoverFeedResponse {
  activities: any[];
  trending_markets: TrendingMarket[];
  featured_traders: FeaturedTrader[];
  suggested_follows: SuggestedUser[];
  has_more: boolean;
  next_cursor?: string;
}

const accuracyTierColors: Record<string, string> = {
  novice: 'bg-gray-500/10 text-gray-500',
  apprentice: 'bg-blue-500/10 text-blue-500',
  analyst: 'bg-purple-500/10 text-purple-500',
  expert: 'bg-amber-500/10 text-amber-500',
  master: 'bg-orange-500/10 text-orange-500',
  oracle: 'bg-red-500/10 text-red-500'
};

const reasonLabels: Record<string, string> = {
  similar_trades: 'একই ধরনের ট্রেড',
  trending: 'ট্রেন্ডিং',
  expert: 'বিশেষজ্ঞ',
  mutual_connection: 'যুক্ত'
};

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center py-8">
      <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
    </div>
  );
}

function TrendingMarketCard({ market, index }: { market: TrendingMarket; index: number }) {
  const isPositive = market.price_movement >= 0;
  const probability = market.probability / 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link href={`/markets/${market.market_id}`}>
        <Card className="hover:border-primary/50 transition-colors cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <Flame className="w-4 h-4 text-orange-500" />
                  <Badge variant="secondary" className="text-xs">
                    {market.category}
                  </Badge>
                </div>
                <p className="font-medium text-sm line-clamp-2 mb-2">
                  {market.question}
                </p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BarChart3 className="w-3 h-3" />
                    ৳{(market.volume_24h / 1000).toFixed(1)}K ভলিউম
                  </span>
                  <span className={cn(
                    'flex items-center gap-1',
                    isPositive ? 'text-green-500' : 'text-red-500'
                  )}>
                    {isPositive ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                    {isPositive ? '+' : ''}{market.price_movement.toFixed(1)}%
                  </span>
                </div>
              </div>
              <div className="text-right">
                <div className={cn(
                  'text-lg font-bold',
                  probability >= 0.5 ? 'text-green-500' : 'text-red-500'
                )}>
                  {(probability * 100).toFixed(0)}%
                </div>
                <div className="text-xs text-muted-foreground">সম্ভাব্যতা</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}

function FeaturedTraderCard({ trader, index }: { trader: FeaturedTrader; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12">
              <AvatarImage src={trader.avatar_url} />
              <AvatarFallback>{trader.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="font-medium text-sm truncate">{trader.full_name}</p>
                <Badge className={cn('text-xs', accuracyTierColors[trader.accuracy_tier])}>
                  {trader.accuracy_tier}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                @{trader.username || 'user'}
              </p>
              <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                <span>{trader.reputation_score.toLocaleString()} REP</span>
                <span>•</span>
                <span>{trader.total_predictions} ভবিষ্যদ্বাণী</span>
              </div>
            </div>
            <FollowButton 
              userId={trader.user_id}
              initialFollowed={trader.is_followed}
              size="sm"
            />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function SuggestedUserCard({ user, index }: { user: SuggestedUser; index: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Card className="hover:border-primary/50 transition-colors">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={user.avatar_url} />
              <AvatarFallback>{user.full_name.charAt(0)}</AvatarFallback>
            </Avatar>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm truncate">{user.full_name}</p>
              <div className="flex items-center gap-2">
                {user.mutual_followers > 0 && (
                  <span className="text-xs text-muted-foreground">
                    {user.mutual_followers} যুক্ত ব্যবহারকারী
                  </span>
                )}
                <Badge variant="outline" className="text-xs">
                  {reasonLabels[user.reason] || user.reason}
                </Badge>
              </div>
            </div>
            <FollowButton userId={user.user_id} size="sm" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

function TrendingSection({ 
  markets, 
  traders, 
  loading 
}: { 
  markets: TrendingMarket[]; 
  traders: FeaturedTrader[];
  loading: boolean;
}) {
  return (
    <div className="space-y-6">
      {/* Trending Markets */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-500" />
            ট্রেন্ডিং মার্কেট
          </h2>
          <Link href="/markets" className="text-sm text-muted-foreground hover:text-primary">
            সব দেখুন <ChevronRight className="w-4 h-4 inline" />
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-3">
            {markets.slice(0, 5).map((market, i) => (
              <TrendingMarketCard key={market.market_id} market={market} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Featured Traders */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            ফিচার্ড ট্রেডার
          </h2>
          <Link href="/leaderboard" className="text-sm text-muted-foreground hover:text-primary">
            লিডারবোর্ড <ChevronRight className="w-4 h-4 inline" />
          </Link>
        </div>
        {loading ? (
          <LoadingSpinner />
        ) : (
          <div className="grid gap-3">
            {traders.slice(0, 5).map((trader, i) => (
              <FeaturedTraderCard key={trader.user_id} trader={trader} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PeopleSection({ 
  suggestedUsers, 
  loading 
}: { 
  suggestedUsers: SuggestedUser[];
  loading: boolean;
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <UserPlus className="w-5 h-5 text-green-500" />
          ফলো করার জন্য সাজেশন
        </h2>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : suggestedUsers.length > 0 ? (
        <div className="grid gap-3">
          {suggestedUsers.map((user, i) => (
            <SuggestedUserCard key={user.user_id} user={user} index={i} />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-6 text-center text-muted-foreground">
            <Users className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>এই মুহূর্তে কোনো সাজেশন নেই</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function ActivitySection({ loading }: { loading: boolean }) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <Clock className="w-5 h-5 text-blue-500" />
          সাম্প্রতিক অ্যাক্টিভিটি
        </h2>
      </div>
      {loading ? (
        <LoadingSpinner />
      ) : (
        <ActivityFeed enableInfiniteScroll={true} batchSize={15} />
      )}
    </div>
  );
}

export default function DiscoverPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('all');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DiscoverFeedResponse>({
    activities: [],
    trending_markets: [],
    featured_traders: [],
    suggested_follows: [],
    has_more: false
  });

  const fetchDiscoverFeed = useCallback(async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const params = new URLSearchParams();
      params.set('limit', '20');
      if (activeTab !== 'all') params.set('section', activeTab);

      const response = await fetch(`/api/discover/feed?${params.toString()}`);
      if (!response.ok) throw new Error('Failed to fetch');
      
      const result = await response.json();
      setData(result);
    } catch (error) {
      console.error('Error fetching discover feed:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [activeTab]);

  useEffect(() => {
    fetchDiscoverFeed();
  }, [fetchDiscoverFeed]);

  const handleRefresh = () => {
    fetchDiscoverFeed(true);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">ডিসকভার</h1>
          <p className="text-sm text-muted-foreground">
            নতুন মার্কেট, ট্রেডার এবং ট্রেন্ড খুঁজুন
          </p>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          <RefreshCw className={cn('w-4 h-4 mr-2', refreshing && 'animate-spin')} />
          রিফ্রেশ
        </Button>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all">সব</TabsTrigger>
          <TabsTrigger value="trending">ট্রেন্ডিং</TabsTrigger>
          <TabsTrigger value="people">মানুষ</TabsTrigger>
          <TabsTrigger value="activity">অ্যাক্টিভিটি</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Trending */}
            <div>
              <TrendingSection 
                markets={data.trending_markets}
                traders={data.featured_traders}
                loading={loading}
              />
            </div>

            {/* Right Column - People & Activity Preview */}
            <div className="space-y-6">
              <PeopleSection 
                suggestedUsers={data.suggested_follows}
                loading={loading}
              />

              {/* Quick Activity Preview */}
              <div>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold flex items-center gap-2">
                    <Eye className="w-5 h-5 text-purple-500" />
                    লাইভ ফিড
                  </h2>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setActiveTab('activity')}
                  >
                    সব দেখুন <ChevronRight className="w-4 h-4 inline" />
                  </Button>
                </div>
                {loading ? (
                  <LoadingSpinner />
                ) : (
                  <Card>
                    <CardContent className="p-4">
                      <div className="space-y-3">
                        {data.activities.slice(0, 3).map((activity, i) => (
                          <div 
                            key={activity.id} 
                            className="flex items-start gap-3 text-sm"
                          >
                            <div className={cn(
                              'w-2 h-2 rounded-full mt-1.5',
                              activity.is_highlighted ? 'bg-primary' : 'bg-muted-foreground/30'
                            )} />
                            <div className="flex-1 min-w-0">
                              <p className="line-clamp-2 text-muted-foreground">
                                {activity.user?.full_name || 'কেউ না'}{' '}
                                {activity.type === 'market_movement' && 'মার্কেটে ট্রেড করেছে'}
                                {activity.type === 'trader_activity' && 'ট্রেড করেছে'}
                                {activity.type === 'social_interaction' && 'সোশ্যাল অ্যাক্টিভিটি'}
                                {activity.type === 'trending_market' && 'ট্রেন্ডিং মার্কেট'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(activity.created_at).toLocaleString('bn-BD', {
                                          month: 'short',
                                          day: 'numeric',
                                          hour: '2-digit',
                                          minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        ))}
                        {data.activities.length === 0 && (
                          <p className="text-center text-muted-foreground py-4">
                            কোনো অ্যাক্টিভিটি নেই
                          </p>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="trending" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {loading ? (
              <div className="col-span-2"><LoadingSpinner /></div>
            ) : (
              <>
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Flame className="w-4 h-4 text-orange-500" />
                    ট্রেন্ডিং মার্কেট
                  </h3>
                  <div className="space-y-3">
                    {data.trending_markets.map((market, i) => (
                      <TrendingMarketCard key={market.market_id} market={market} index={i} />
                    ))}
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    ফিচার্ড ট্রেডার
                  </h3>
                  <div className="space-y-3">
                    {data.featured_traders.map((trader, i) => (
                      <FeaturedTraderCard key={trader.user_id} trader={trader} index={i} />
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        </TabsContent>

        <TabsContent value="people" className="mt-6">
          <PeopleSection 
            suggestedUsers={data.suggested_follows}
            loading={loading}
          />
        </TabsContent>

        <TabsContent value="activity" className="mt-6">
          <ActivitySection loading={loading} />
        </TabsContent>
      </Tabs>
    </div>
  );
}
