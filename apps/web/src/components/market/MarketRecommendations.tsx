'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    TrendingUp,
    TrendingDown,
    Clock,
    Sparkles,
    RefreshCw,
    ChevronRight,
    Zap,
    BarChart3,
    Target,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Market {
    id: string;
    question: string;
    slug: string;
    yes_price: number;
    no_price: number;
    total_volume: number;
    status: string;
    trading_closes_at: string;
    category: string;
}

interface UserProfile {
    interests: string[];
    trading_history: any[];
    risk_tolerance: 'low' | 'medium' | 'high';
}

interface MarketRecommendationsProps {
    userId?: string;
}

export function MarketRecommendations({ userId }: MarketRecommendationsProps) {
    const { t } = useTranslation();
    const supabase = createClient();

    const [markets, setMarkets] = useState<Market[]>([]);
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('trending');

    // Fetch markets and user profile
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch active markets
                const { data: marketsData } = await supabase
                    .from('markets')
                    .select('id, question, slug, yes_price, no_price, total_volume, status, trading_closes_at, category')
                    .eq('status', 'active')
                    .order('total_volume', { ascending: false })
                    .limit(50);

                if (marketsData) {
                    setMarkets(marketsData);
                }

                // Fetch user profile for personalization
                if (userId) {
                    const { data: profileData } = await supabase
                        .from('user_profiles')
                        .select('interests, trading_history, risk_tolerance')
                        .eq('user_id', userId)
                        .single();

                    if (profileData) {
                        setUserProfile(profileData);
                    }
                }
            } catch (error) {
                console.error('Error fetching recommendations:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, [userId]);

    // Calculate recommendations
    const recommendations = useMemo(() => {
        if (markets.length === 0) {
            return { trending: [], closingSoon: [], highLiquidity: [], aiSuggested: [] };
        }

        const now = new Date();

        // Trending: Most active in last 24h (by volume)
        const trending = [...markets]
            .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
            .slice(0, 5);

        // Closing Soon: Markets closing within 24h
        const closingSoon = markets
            .filter(m => {
                const closeDate = new Date(m.trading_closes_at);
                const hoursLeft = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                return hoursLeft > 0 && hoursLeft <= 24;
            })
            .sort((a, b) => new Date(a.trading_closes_at).getTime() - new Date(b.trading_closes_at).getTime())
            .slice(0, 5);

        // High Liquidity: Best spreads (closest to 50/50)
        const highLiquidity = [...markets]
            .filter(m => m.yes_price && m.no_price)
            .map(m => ({
                ...m,
                spread: Math.abs(m.yes_price - 0.5)
            }))
            .sort((a, b) => a.spread - b.spread)
            .slice(0, 5);

        // AI Suggested: Based on user interests (if available)
        let aiSuggested = [...markets];
        if (userProfile && userProfile.interests && userProfile.interests.length > 0) {
            // Weight markets matching user interests
            aiSuggested = markets.map(m => {
                let score = 0;
                const marketText = `${m.question} ${m.category || ''}`.toLowerCase();

                userProfile.interests.forEach((interest: string) => {
                    if (marketText.includes(interest.toLowerCase())) {
                        score += 10;
                    }
                });

                // Add volume score
                score += Math.log10((m.total_volume || 1) + 1) * 2;

                // Add recency score
                const closeDate = new Date(m.trading_closes_at);
                const hoursLeft = (closeDate.getTime() - now.getTime()) / (1000 * 60 * 60);
                if (hoursLeft > 0 && hoursLeft < 48) score += 5;

                return { ...m, aiScore: score };
            })
                .sort((a, b) => (b.aiScore || 0) - (a.aiScore || 0))
                .slice(0, 5);
        } else {
            // Fallback to popular markets
            aiSuggested = markets
                .sort((a, b) => (b.total_volume || 0) - (a.total_volume || 0))
                .slice(0, 5);
        }

        return { trending, closingSoon, highLiquidity, aiSuggested };
    }, [markets, userProfile]);

    const getTimeRemaining = (closesAt: string) => {
        const now = new Date();
        const close = new Date(closesAt);
        const diff = close.getTime() - now.getTime();

        if (diff <= 0) return 'Closed';

        const hours = Math.floor(diff / (1000 * 60 * 60));
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

        if (hours > 24) {
            const days = Math.floor(hours / 24);
            return `${days}d ${hours % 24}h`;
        }

        return `${hours}h ${minutes}m`;
    };

    const MarketCard = ({ market, compact = false }: { market: Market & { aiScore?: number }; compact?: boolean }) => {
        const price = market.yes_price || 0.5;
        const change = price > 0.5 ? 'up' : price < 0.5 ? 'down' : 'stable';

        return (
            <Link
                href={`/markets/${market.slug}`}
                className={`block p-3 rounded-lg border hover:bg-muted/50 transition-colors ${compact ? '' : 'p-4'}`}
            >
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1 min-w-0">
                        <h4 className={`font-medium truncate ${compact ? 'text-sm' : 'text-base'}`}>
                            {market.question}
                        </h4>
                        {market.category && (
                            <Badge variant="outline" className="mt-1 text-xs">
                                {market.category}
                            </Badge>
                        )}
                    </div>
                    <div className="text-right flex-shrink-0">
                        <div className={`font-bold ${price >= 0.5 ? 'text-green-500' : 'text-red-500'}`}>
                            {(price * 100).toFixed(0)}%
                        </div>
                        <div className="text-xs text-muted-foreground">
                            Vol: ${((market.total_volume || 0) / 1000).toFixed(1)}K
                        </div>
                    </div>
                </div>
                {!compact && (
                    <div className="mt-3 flex items-center justify-between">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="w-3 h-3" />
                            {getTimeRemaining(market.trading_closes_at)}
                        </div>
                        {change === 'up' ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : change === 'down' ? (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        ) : null}
                    </div>
                )}
                {(market as any).aiScore !== undefined && (
                    <div className="mt-2 flex items-center gap-1 text-xs text-purple-500">
                        <Sparkles className="w-3 h-3" />
                        Match Score: {(market as any).aiScore}
                    </div>
                )}
            </Link>
        );
    };

    if (isLoading) {
        return (
            <Card>
                <CardContent className="pt-6">
                    <div className="flex justify-center py-8">
                        <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5" />
                    Market Recommendations
                </CardTitle>
                <CardDescription>AI-powered suggestions based on your interests and trading history</CardDescription>
            </CardHeader>
            <CardContent>
                <Tabs value={activeTab} onValueChange={setActiveTab}>
                    <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="trending" className="gap-1">
                            <TrendingUp className="w-3 h-3" />
                            Trending
                        </TabsTrigger>
                        <TabsTrigger value="closing" className="gap-1">
                            <Clock className="w-3 h-3" />
                            Closing Soon
                        </TabsTrigger>
                        <TabsTrigger value="liquidity" className="gap-1">
                            <BarChart3 className="w-3 h-3" />
                            High Liquidity
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="gap-1">
                            <Sparkles className="w-3 h-3" />
                            For You
                        </TabsTrigger>
                    </TabsList>

                    <TabsContent value="trending" className="mt-4">
                        <div className="space-y-2">
                            {recommendations.trending.map(market => (
                                <MarketCard key={market.id} market={market} />
                            ))}
                            {recommendations.trending.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No trending markets</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="closing" className="mt-4">
                        <div className="space-y-2">
                            {recommendations.closingSoon.map(market => (
                                <MarketCard key={market.id} market={market} />
                            ))}
                            {recommendations.closingSoon.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No markets closing soon</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="liquidity" className="mt-4">
                        <div className="space-y-2">
                            {recommendations.highLiquidity.map(market => (
                                <MarketCard key={market.id} market={market} />
                            ))}
                            {recommendations.highLiquidity.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No high liquidity markets</p>
                            )}
                        </div>
                    </TabsContent>

                    <TabsContent value="ai" className="mt-4">
                        <div className="space-y-2">
                            {recommendations.aiSuggested.map(market => (
                                <MarketCard key={market.id} market={market} />
                            ))}
                            {recommendations.aiSuggested.length === 0 && (
                                <p className="text-center text-muted-foreground py-4">No personalized recommendations yet</p>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </CardContent>
        </Card>
    );
}

export default MarketRecommendations;
