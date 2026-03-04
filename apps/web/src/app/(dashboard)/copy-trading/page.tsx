'use client';

import { useState, useEffect, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import {
    Users,
    TrendingUp,
    TrendingDown,
    Copy,
    Star,
    Crown,
    Trophy,
    RefreshCw,
    ChevronRight,
    Settings,
    DollarSign,
    Percent,
    Zap,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface TopTrader {
    user_id: string;
    username: string;
    avatar_url?: string;
    win_rate: number;
    total_trades: number;
    roi: number;
    followers: number;
    monthly_return: number;
}

interface CopyTrade {
    id: string;
    trader_id: string;
    trader_name: string;
    market_question: string;
    outcome: 'YES' | 'NO';
    quantity: number;
    price: number;
    copied_at: string;
    pnl?: number;
}

interface FollowingTrader {
    user_id: string;
    username: string;
    copy_percentage: number;
    auto_invest: boolean;
    total_invested: number;
    total_pnl: number;
}

export default function CopyTradingPage() {
    const { t } = useTranslation();
    const supabase = createClient();

    const [topTraders, setTopTraders] = useState<TopTrader[]>([]);
    const [following, setFollowing] = useState<FollowingTrader[]>([]);
    const [myCopyTrades, setMyCopyTrades] = useState<CopyTrade[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('discover');
    const [currentUser, setCurrentUser] = useState<string | null>(null);

    // Fetch current user
    useEffect(() => {
        const getUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            setCurrentUser(user?.id || null);
        };
        getUser();
    }, []);

    // Fetch copy trading data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch top traders from leaderboard
                const { data: traders } = await supabase
                    .from('leaderboard')
                    .select('user_id, username, avatar_url, win_rate, total_trades, roi, followers, monthly_return')
                    .order('roi', { ascending: false })
                    .limit(20);

                if (traders) {
                    setTopTraders(traders);
                }

                // Fetch following (mock data for demo)
                setFollowing([
                    { user_id: '1', username: 'ProTrader_BD', copy_percentage: 10, auto_invest: true, total_invested: 5000, total_pnl: 1250 },
                    { user_id: '2', username: 'CryptoKing', copy_percentage: 5, auto_invest: false, total_invested: 2500, total_pnl: 800 },
                ]);

                // Fetch my copy trades (mock data)
                setMyCopyTrades([
                    { id: '1', trader_id: '1', trader_name: 'ProTrader_BD', market_question: 'Will Bitcoin hit $100K in 2024?', outcome: 'YES', quantity: 100, price: 0.45, copied_at: '2024-01-15', pnl: 15 },
                    { id: '2', trader_id: '1', trader_name: 'ProTrader_BD', market_question: 'Will Trump win 2024 election?', outcome: 'NO', quantity: 50, price: 0.52, copied_at: '2024-01-10', pnl: -5 },
                ]);
            } catch (error) {
                console.error('Error fetching copy trading data:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    // Follow a trader
    const handleFollow = async (traderId: string, copyPercentage: number = 10) => {
        if (!currentUser) {
            alert('Please login to follow traders');
            return;
        }

        try {
            // In production, save to database
            setFollowing(prev => [...prev, {
                user_id: traderId,
                username: topTraders.find(t => t.user_id === traderId)?.username || 'Unknown',
                copy_percentage: copyPercentage,
                auto_invest: false,
                total_invested: 0,
                total_pnl: 0,
            }]);
        } catch (error) {
            console.error('Error following trader:', error);
        }
    };

    // Unfollow a trader
    const handleUnfollow = async (traderId: string) => {
        setFollowing(prev => prev.filter(t => t.user_id !== traderId));
    };

    const TraderCard = ({ trader, showFollow = true }: { trader: TopTrader; showFollow?: boolean }) => {
        const isFollowing = following.some(f => f.user_id === trader.user_id);
        const isTop3 = topTraders.slice(0, 3).some(t => t.user_id === trader.user_id);

        return (
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="relative">
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                            {trader.username?.charAt(0) || 'T'}
                        </div>
                        {isTop3 && (
                            <div className="absolute -top-1 -right-1">
                                <Crown className="w-4 h-4 text-amber-500" />
                            </div>
                        )}
                    </div>

                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                            <h4 className="font-semibold truncate">{trader.username}</h4>
                            {trader.followers > 100 && (
                                <Badge variant="outline" className="text-xs">
                                    <Star className="w-3 h-3 mr-1" />
                                    Top
                                </Badge>
                            )}
                        </div>
                        <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1">
                                <TrendingUp className="w-3 h-3 text-green-500" />
                                {trader.win_rate?.toFixed(1)}% WR
                            </span>
                            <span>{trader.total_trades} trades</span>
                        </div>
                    </div>

                    <div className="text-right">
                        <div className={`text-xl font-bold ${trader.roi >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                            {trader.roi >= 0 ? '+' : ''}{trader.roi?.toFixed(1)}%
                        </div>
                        <div className="text-xs text-muted-foreground">ROI</div>
                    </div>
                </div>

                <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <div className="flex items-center gap-4 text-sm">
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {trader.followers || 0} followers
                        </span>
                        <span className="flex items-center gap-1 text-muted-foreground">
                            <Percent className="w-3 h-3" />
                            {trader.monthly_return?.toFixed(1)}%/mo
                        </span>
                    </div>

                    {showFollow && (
                        <Button
                            variant={isFollowing ? 'outline' : 'default'}
                            size="sm"
                            onClick={() => isFollowing ? handleUnfollow(trader.user_id) : handleFollow(trader.user_id)}
                            disabled={trader.user_id === currentUser}
                        >
                            {isFollowing ? 'Following' : (
                                <>
                                    <Copy className="w-3 h-3 mr-1" />
                                    Copy
                                </>
                            )}
                        </Button>
                    )}
                </div>
            </div>
        );
    };

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <RefreshCw className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Copy className="w-6 h-6" />
                        Copy Trading
                    </h1>
                    <p className="text-muted-foreground">Follow top traders and automatically copy their trades</p>
                </div>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Following</div>
                        <div className="text-2xl font-bold">{following.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total Invested</div>
                        <div className="text-2xl font-bold">৳{following.reduce((sum, t) => sum + t.total_invested, 0).toLocaleString()}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Total P&L</div>
                        <div className="text-2xl font-bold text-green-500">
                            ৳{following.reduce((sum, t) => sum + t.total_pnl, 0).toLocaleString()}
                        </div>
                    </CardContent>
                </Card>
                <Card>
                    <CardContent className="pt-4">
                        <div className="text-sm text-muted-foreground">Active Trades</div>
                        <div className="text-2xl font-bold">{myCopyTrades.filter(t => !t.pnl).length}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="discover">Discover Traders</TabsTrigger>
                    <TabsTrigger value="following">Following</TabsTrigger>
                    <TabsTrigger value="my-trades">My Copy Trades</TabsTrigger>
                </TabsList>

                {/* Discover Tab */}
                <TabsContent value="discover" className="mt-4">
                    <div className="space-y-4">
                        {/* Top Performers */}
                        <div className="flex items-center gap-2 mb-4">
                            <Trophy className="w-5 h-5 text-amber-500" />
                            <h3 className="font-semibold">Top Performers This Month</h3>
                        </div>

                        {topTraders.map(trader => (
                            <TraderCard key={trader.user_id} trader={trader} />
                        ))}

                        {topTraders.length === 0 && (
                            <p className="text-center text-muted-foreground py-8">
                                No traders found. Start trading to appear on the leaderboard!
                            </p>
                        )}
                    </div>
                </TabsContent>

                {/* Following Tab */}
                <TabsContent value="following" className="mt-4">
                    <div className="space-y-4">
                        {following.length === 0 ? (
                            <div className="text-center py-8">
                                <Users className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground mb-4">You're not following any traders yet</p>
                                <Button onClick={() => setActiveTab('discover')}>
                                    Discover Traders
                                </Button>
                            </div>
                        ) : (
                            following.map(trader => (
                                <div key={trader.user_id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center text-white font-bold">
                                                {trader.username?.charAt(0)}
                                            </div>
                                            <div>
                                                <h4 className="font-semibold">{trader.username}</h4>
                                                <p className="text-sm text-muted-foreground">
                                                    Copy: {trader.copy_percentage}% | Auto-invest: {trader.auto_invest ? 'On' : 'Off'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-xl font-bold text-green-500">
                                                ৳{trader.total_pnl.toLocaleString()}
                                            </div>
                                            <p className="text-xs text-muted-foreground">Total P&L</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between mt-3 pt-3 border-t">
                                        <div className="text-sm text-muted-foreground">
                                            Invested: ৳{trader.total_invested.toLocaleString()}
                                        </div>
                                        <div className="flex gap-2">
                                            <Button variant="outline" size="sm">
                                                <Settings className="w-3 h-3 mr-1" />
                                                Settings
                                            </Button>
                                            <Button variant="outline" size="sm" onClick={() => handleUnfollow(trader.user_id)}>
                                                Unfollow
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>

                {/* My Copy Trades Tab */}
                <TabsContent value="my-trades" className="mt-4">
                    <div className="space-y-4">
                        {myCopyTrades.length === 0 ? (
                            <div className="text-center py-8">
                                <Copy className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                                <p className="text-muted-foreground">No copy trades yet</p>
                            </div>
                        ) : (
                            myCopyTrades.map(trade => (
                                <div key={trade.id} className="p-4 border rounded-lg">
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <h4 className="font-medium">{trade.market_question}</h4>
                                                <Badge variant={trade.outcome === 'YES' ? 'default' : 'destructive'}>
                                                    {trade.outcome}
                                                </Badge>
                                            </div>
                                            <p className="text-sm text-muted-foreground mt-1">
                                                Copied from {trade.trader_name} | {trade.quantity} @ ${trade.price}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <div className={`text-xl font-bold ${(trade.pnl || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                                {trade.pnl !== undefined ? (trade.pnl >= 0 ? '+' : '') + `৳${trade.pnl}` : 'Open'}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </TabsContent>
            </Tabs>
        </div>
    );
}
