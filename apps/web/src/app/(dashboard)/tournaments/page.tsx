'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Trophy,
    Medal,
    Crown,
    Star,
    Users,
    Calendar,
    DollarSign,
    ChevronRight,
    Clock,
    Zap,
    Target,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { createClient } from '@/lib/supabase/client';
import Link from 'next/link';

interface Tournament {
    id: string;
    name: string;
    description: string;
    start_date: string;
    end_date: string;
    entry_fee: number;
    prize_pool: number;
    status: 'upcoming' | 'active' | 'completed';
    participants_count: number;
    max_participants: number;
}

interface TournamentParticipant {
    rank: number;
    user_id: string;
    username: string;
    avatar_url?: string;
    score: number;
    roi: number;
    trades: number;
}

interface MyTournament {
    tournament_id: string;
    tournament_name: string;
    rank: number;
    score: number;
    trades_count: number;
}

export default function TournamentsPage() {
    const { t } = useTranslation();
    const supabase = createClient();

    const [tournaments, setTournaments] = useState<Tournament[]>([]);
    const [leaderboard, setLeaderboard] = useState<TournamentParticipant[]>([]);
    const [myTournaments, setMyTournaments] = useState<MyTournament[]>([]);
    const [selectedTournament, setSelectedTournament] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('active');

    // Fetch tournament data
    useEffect(() => {
        const fetchData = async () => {
            setIsLoading(true);
            try {
                // Fetch tournaments
                const { data: tournamentsData } = await supabase
                    .from('tournaments')
                    .select('*')
                    .order('start_date', { ascending: false });

                if (tournamentsData) {
                    setTournaments(tournamentsData);
                    if (tournamentsData.length > 0 && tournamentsData[0].status === 'active') {
                        setSelectedTournament(tournamentsData[0].id);
                    }
                }

                // Mock data for demo
                setTournaments([
                    {
                        id: '1',
                        name: 'Weekly Championship',
                        description: 'Compete for the top spot in our weekly trading competition',
                        start_date: new Date().toISOString(),
                        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
                        entry_fee: 1000,
                        prize_pool: 50000,
                        status: 'active',
                        participants_count: 156,
                        max_participants: 500,
                    },
                    {
                        id: '2',
                        name: 'Monthly Masters',
                        description: 'Month-long competition with bigger prizes',
                        start_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
                        end_date: new Date(Date.now() + 44 * 24 * 60 * 60 * 1000).toISOString(),
                        entry_fee: 5000,
                        prize_pool: 250000,
                        status: 'upcoming',
                        participants_count: 89,
                        max_participants: 200,
                    },
                    {
                        id: '3',
                        name: 'Bangladesh Open',
                        description: 'Open to all traders in Bangladesh',
                        start_date: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
                        end_date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
                        entry_fee: 500,
                        prize_pool: 25000,
                        status: 'completed',
                        participants_count: 234,
                        max_participants: 500,
                    },
                ]);

                // Mock leaderboard
                setLeaderboard([
                    { rank: 1, user_id: '1', username: 'TraderPro_BD', score: 15420, roi: 45.2, trades: 89 },
                    { rank: 2, user_id: '2', username: 'CryptoKing', score: 14850, roi: 42.1, trades: 76 },
                    { rank: 3, user_id: '3', username: 'MarketMaster', score: 13200, roi: 38.5, trades: 65 },
                    { rank: 4, user_id: '4', username: 'WinnerBD', score: 12100, roi: 35.2, trades: 58 },
                    { rank: 5, user_id: '5', username: 'PredictionKing', score: 11500, roi: 32.8, trades: 52 },
                ]);

                // Mock my tournaments
                setMyTournaments([
                    { tournament_id: '1', tournament_name: 'Weekly Championship', rank: 12, score: 8200, trades_count: 34 },
                ]);
            } catch (error) {
                console.error('Error fetching tournaments:', error);
            } finally {
                setIsLoading(false);
            }
        };

        fetchData();
    }, []);

    const getTimeRemaining = (date: string) => {
        const now = new Date();
        const target = new Date(date);
        const diff = target.getTime() - now.getTime();

        if (diff <= 0) return 'Ended';

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

        return `${days}d ${hours}h`;
    };

    const getPrizeDistribution = (prizePool: number) => [
        { rank: 1, prize: prizePool * 0.40, percentage: 40 },
        { rank: 2, prize: prizePool * 0.25, percentage: 25 },
        { rank: 3, prize: prizePool * 0.15, percentage: 15 },
        { rank: 4, prize: prizePool * 0.10, percentage: 10 },
        { rank: 5, prize: prizePool * 0.10, percentage: 10 },
    ];

    const activeTournament = tournaments.find(t => t.id === selectedTournament);
    const prizeDistribution = activeTournament ? getPrizeDistribution(activeTournament.prize_pool) : [];
    const myRank = myTournaments.find(t => t.tournament_id === selectedTournament);

    if (isLoading) {
        return (
            <div className="flex justify-center py-12">
                <Trophy className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold flex items-center gap-2">
                        <Trophy className="w-6 h-6" />
                        Tournaments
                    </h1>
                    <p className="text-muted-foreground">Compete with other traders and win prizes</p>
                </div>
            </div>

            {/* My Performance */}
            {myRank && (
                <Card className="bg-gradient-to-r from-amber-500/10 to-yellow-500/10 border-amber-200">
                    <CardContent className="pt-4">
                        <div className="flex items-center justify-between">
                            <div>
                                <div className="text-sm text-muted-foreground">Your Current Rank</div>
                                <div className="text-3xl font-bold flex items-center gap-2">
                                    <Medal className="w-6 h-6 text-amber-500" />
                                    #{myRank.rank}
                                </div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Score</div>
                                <div className="text-2xl font-bold">{myRank.score.toLocaleString()}</div>
                            </div>
                            <div className="text-right">
                                <div className="text-sm text-muted-foreground">Trades</div>
                                <div className="text-2xl font-bold">{myRank.trades_count}</div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="active">Active</TabsTrigger>
                    <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                    <TabsTrigger value="completed">Completed</TabsTrigger>
                </TabsList>

                {/* Active Tournaments */}
                <TabsContent value="active" className="mt-4">
                    <div className="space-y-4">
                        {tournaments.filter(t => t.status === 'active').map(tournament => (
                            <Card key={tournament.id} className={selectedTournament === tournament.id ? 'ring-2 ring-primary' : ''}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle className="flex items-center gap-2">
                                                <Zap className="w-5 h-5 text-amber-500" />
                                                {tournament.name}
                                            </CardTitle>
                                            <CardDescription>{tournament.description}</CardDescription>
                                        </div>
                                        <Badge variant="default" className="bg-green-500">
                                            Active
                                        </Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Entry Fee</div>
                                            <div className="font-bold">৳{tournament.entry_fee.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Prize Pool</div>
                                            <div className="font-bold text-green-500">৳{tournament.prize_pool.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Participants</div>
                                            <div className="font-bold">{tournament.participants_count}/{tournament.max_participants}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Ends In</div>
                                            <div className="font-bold flex items-center gap-1">
                                                <Clock className="w-4 h-4" />
                                                {getTimeRemaining(tournament.end_date)}
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2">
                                        <Button onClick={() => setSelectedTournament(tournament.id)}>
                                            View Leaderboard
                                        </Button>
                                        <Button variant="outline">
                                            Join Tournament
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {tournaments.filter(t => t.status === 'active').length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No active tournaments</p>
                        )}
                    </div>
                </TabsContent>

                {/* Upcoming Tournaments */}
                <TabsContent value="upcoming" className="mt-4">
                    <div className="space-y-4">
                        {tournaments.filter(t => t.status === 'upcoming').map(tournament => (
                            <Card key={tournament.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{tournament.name}</CardTitle>
                                            <CardDescription>{tournament.description}</CardDescription>
                                        </div>
                                        <Badge variant="outline">Upcoming</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Entry Fee</div>
                                            <div className="font-bold">৳{tournament.entry_fee.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Prize Pool</div>
                                            <div className="font-bold text-green-500">৳{tournament.prize_pool.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Starts In</div>
                                            <div className="font-bold">{getTimeRemaining(tournament.start_date)}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Registered</div>
                                            <div className="font-bold">{tournament.participants_count}/{tournament.max_participants}</div>
                                        </div>
                                    </div>
                                    <Button className="mt-4" variant="outline">
                                        Register Now
                                    </Button>
                                </CardContent>
                            </Card>
                        ))}

                        {tournaments.filter(t => t.status === 'upcoming').length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No upcoming tournaments</p>
                        )}
                    </div>
                </TabsContent>

                {/* Completed Tournaments */}
                <TabsContent value="completed" className="mt-4">
                    <div className="space-y-4">
                        {tournaments.filter(t => t.status === 'completed').map(tournament => (
                            <Card key={tournament.id}>
                                <CardHeader>
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <CardTitle>{tournament.name}</CardTitle>
                                            <CardDescription>{tournament.description}</CardDescription>
                                        </div>
                                        <Badge variant="secondary">Completed</Badge>
                                    </div>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-3 gap-4">
                                        <div>
                                            <div className="text-sm text-muted-foreground">Winner</div>
                                            <div className="font-bold flex items-center gap-1">
                                                <Crown className="w-4 h-4 text-amber-500" />
                                                {leaderboard[0]?.username || 'N/A'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Prize Pool</div>
                                            <div className="font-bold">৳{tournament.prize_pool.toLocaleString()}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-muted-foreground">Participants</div>
                                            <div className="font-bold">{tournament.participants_count}</div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}

                        {tournaments.filter(t => t.status === 'completed').length === 0 && (
                            <p className="text-center text-muted-foreground py-8">No completed tournaments</p>
                        )}
                    </div>
                </TabsContent>
            </Tabs>

            {/* Leaderboard */}
            {selectedTournament && activeTournament && (
                <Card>
                    <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                            <Target className="w-5 h-5" />
                            {activeTournament.name} Leaderboard
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {/* Prize Distribution */}
                        <div className="mb-6 p-4 bg-muted rounded-lg">
                            <h4 className="font-semibold mb-3">Prize Distribution</h4>
                            <div className="grid grid-cols-5 gap-2">
                                {prizeDistribution.map(p => (
                                    <div key={p.rank} className="text-center">
                                        <div className="text-lg font-bold">#{p.rank}</div>
                                        <div className="text-sm text-green-500">৳{p.prize.toLocaleString()}</div>
                                        <div className="text-xs text-muted-foreground">{p.percentage}%</div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Leaderboard Table */}
                        <div className="space-y-2">
                            {leaderboard.map((participant, index) => (
                                <div
                                    key={participant.user_id}
                                    className={`flex items-center justify-between p-3 rounded-lg ${participant.rank <= 3 ? 'bg-gradient-to-r from-amber-500/10 to-transparent' : 'bg-muted/50'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${participant.rank === 1 ? 'bg-amber-500 text-white' :
                                                participant.rank === 2 ? 'bg-gray-400 text-white' :
                                                    participant.rank === 3 ? 'bg-amber-700 text-white' :
                                                        'bg-muted'
                                            }`}>
                                            {participant.rank <= 3 ? (
                                                <Crown className="w-4 h-4" />
                                            ) : participant.rank}
                                        </div>
                                        <div>
                                            <div className="font-medium flex items-center gap-2">
                                                {participant.username}
                                                {participant.rank <= 3 && <Star className="w-4 h-4 text-amber-500" />}
                                            </div>
                                            <div className="text-sm text-muted-foreground">
                                                {participant.trades} trades
                                            </div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="font-bold">{participant.score.toLocaleString()}</div>
                                        <div className="text-sm text-green-500">+{participant.roi}% ROI</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
