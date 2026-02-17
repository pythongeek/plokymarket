'use client';

import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { createClient } from '@/lib/supabase/client';
import { Loader2, TrendingUp, ShieldCheck, Wallet, Trophy, Star, Crown, Zap } from 'lucide-react';
import { useStore } from '@/store/useStore';
import Link from 'next/link';

interface LevelProgress {
    current_level_id: number;
    current_level_name: string;
    current_benefits: any;
    total_volume: number;
    next_level_name: string | null;
    next_level_requirement: number | null;
    volume_needed: number;
    progress_percentage: number;
}

interface Level {
    id: number;
    name: string;
    min_volume: number;
    kyc_required: number;
    benefits: any;
    description: string;
}

export default function LevelsPage() {
    const { currentUser: user } = useStore();
    const [progress, setProgress] = useState<LevelProgress | null>(null);
    const [levels, setLevels] = useState<Level[]>([]);
    const [loading, setLoading] = useState(true);
    const supabase = createClient();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch levels
                const { data: levelsData } = await supabase
                    .from('levels')
                    .select('*')
                    .order('min_volume', { ascending: true });

                if (levelsData) setLevels(levelsData);

                // Fetch user progress
                const { data: { session } } = await supabase.auth.getSession();
                if (session?.user) {
                    const { data: progressData } = await supabase
                        .from('user_level_progress')
                        .select('*')
                        .eq('user_id', session.user.id)
                        .single();

                    if (progressData) setProgress(progressData);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center p-8 min-h-[60vh]">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    const getLevelIcon = (levelName: string) => {
        switch (levelName?.toLowerCase()) {
            case 'novice': return <Star className="h-6 w-6 text-gray-400" />;
            case 'trader': return <TrendingUp className="h-6 w-6 text-blue-500" />;
            case 'pro': return <Zap className="h-6 w-6 text-purple-500" />;
            case 'expert': return <ShieldCheck className="h-6 w-6 text-orange-500" />;
            case 'whale': return <Crown className="h-6 w-6 text-yellow-500" />;
            default: return <Trophy className="h-6 w-6" />;
        }
    };

    return (
        <div className="container py-8 space-y-8">
            {/* Header Section */}
            <div className="text-center space-y-4">
                <h1 className="text-4xl font-bold tracking-tight bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                    Loyalty & Rewards
                </h1>
                <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Level up by trading on Plokymarket. Unlock lower fees, higher limits, and exclusive VIP perks.
                </p>
            </div>

            {/* Progress Card */}
            {progress ? (
                <Card className="border-primary/20 bg-gradient-to-br from-card to-primary/5">
                    <CardContent className="p-8">
                        <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                            <div className="flex items-center gap-6">
                                <div className="relative">
                                    <div className="h-24 w-24 rounded-full bg-background border-4 border-primary/20 flex items-center justify-center shadow-xl">
                                        {getLevelIcon(progress.current_level_name)}
                                    </div>
                                    <div className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground px-3 py-1 rounded-full text-sm font-bold">
                                        Lvl {progress.current_level_id}
                                    </div>
                                </div>
                                <div className="text-center md:text-left">
                                    <h2 className="text-3xl font-bold">{progress.current_level_name}</h2>
                                    <p className="text-muted-foreground">Total Volume: ৳{progress.total_volume.toLocaleString()}</p>
                                </div>
                            </div>

                            <div className="flex-1 w-full md:max-w-xl space-y-4">
                                {progress.next_level_name ? (
                                    <>
                                        <div className="flex justify-between text-sm font-medium">
                                            <span>Next: <span className="text-primary">{progress.next_level_name}</span></span>
                                            <span>{progress.progress_percentage}%</span>
                                        </div>
                                        <Progress value={progress.progress_percentage} className="h-4" />
                                        <p className="text-sm text-muted-foreground text-right">
                                            Need ৳{progress.volume_needed.toLocaleString()} more volume to level up
                                        </p>
                                    </>
                                ) : (
                                    <div className="text-center py-4 bg-primary/10 rounded-lg">
                                        <h3 className="text-lg font-bold text-primary">Max Level Reached! 👑</h3>
                                        <p className="text-sm text-muted-foreground">You are at the top of the food chain.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ) : (
                <Card>
                    <CardContent className="p-8 text-center">
                        <p>Please log in to see your progress.</p>
                        <Button className="mt-4" asChild><Link href="/login">Log In</Link></Button>
                    </CardContent>
                </Card>
            )}

            {/* Levels Comparison */}
            <h2 className="text-2xl font-bold mt-12 mb-6">Tier Benefits</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
                {levels.map((level) => {
                    const isCurrent = progress?.current_level_id === level.id;
                    return (
                        <Card key={level.id} className={`relative overflow-hidden transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${isCurrent ? 'border-primary ring-2 ring-primary/20 shadow-primary/10' : ''}`}>
                            {isCurrent && (
                                <div className="absolute top-0 right-0 bg-primary text-primary-foreground text-[10px] uppercase font-bold px-2 py-1 rounded-bl-lg">
                                    Current
                                </div>
                            )}
                            <CardHeader className="pb-2 text-center">
                                <div className="mx-auto mb-2 h-12 w-12 flex items-center justify-center rounded-full bg-muted">
                                    {getLevelIcon(level.name)}
                                </div>
                                <CardTitle>{level.name}</CardTitle>
                                <CardDescription className="text-xs">
                                    {level.min_volume === 0 ? 'No minimum' : `৳${level.min_volume.toLocaleString()}+`}
                                </CardDescription>
                            </CardHeader>
                            <CardContent className="text-center space-y-4 text-sm">
                                <p className="min-h-[40px] text-muted-foreground text-xs">{level.description}</p>

                                <div className="space-y-2 pt-2 border-t">
                                    {level.benefits.trading_fee_discount > 0 ? (
                                        <div className="flex items-center gap-2 justify-center text-emerald-600 font-medium">
                                            <TrendingUp className="h-4 w-4" />
                                            -{level.benefits.trading_fee_discount}% Fees
                                        </div>
                                    ) : (
                                        <div className="text-muted-foreground text-xs">Standard Fees</div>
                                    )}

                                    <div className="flex items-center gap-2 justify-center">
                                        <Wallet className="h-4 w-4 text-muted-foreground" />
                                        {level.benefits.withdrawal_limit === -1
                                            ? 'Unlimited'
                                            : `৳${level.benefits.withdrawal_limit?.toLocaleString()}`}
                                    </div>

                                    {level.benefits.instant_withdrawal && (
                                        <Badge variant="secondary" className="bg-purple-100 text-purple-700 w-full justify-center">
                                            <Zap className="h-3 w-3 mr-1" /> Instant Withdraw
                                        </Badge>
                                    )}

                                    {level.benefits.vip_support && (
                                        <Badge variant="secondary" className="bg-amber-100 text-amber-700 w-full justify-center">
                                            <Crown className="h-3 w-3 mr-1" /> VIP Support
                                        </Badge>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    );
                })}
            </div>
        </div>
    );
}
