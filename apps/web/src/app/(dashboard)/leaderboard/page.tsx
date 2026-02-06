'use client';

import { useEffect, useState } from 'react';
import { RankTable } from '@/components/leaderboard/RankTable';
import { LeagueView } from '@/components/leaderboard/LeagueView';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function LeaderboardPage() {
    const [entries, setEntries] = useState([]);
    const [timeframe, setTimeframe] = useState('weekly');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            try {
                const res = await fetch(`/api/leaderboard?timeframe=${timeframe}`);
                const json = await res.json();
                setEntries(json.data || []);
            } catch (e) {
                console.error("Failed to fetch leaderboard", e);
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, [timeframe]);

    return (
        <div className="space-y-8 min-h-screen pb-10">
            <div className="flex justify-between items-end">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
                    <p className="text-muted-foreground">Compete against the best traders in Bangladesh.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2 space-y-6">
                    <Tabs defaultValue="weekly" onValueChange={setTimeframe} className="w-full">
                        <TabsList>
                            <TabsTrigger value="daily">Daily</TabsTrigger>
                            <TabsTrigger value="weekly">Weekly</TabsTrigger>
                            <TabsTrigger value="monthly">Monthly</TabsTrigger>
                            <TabsTrigger value="all_time">All Time</TabsTrigger>
                        </TabsList>

                        <TabsContent value={timeframe} className="mt-4">
                            {loading ? (
                                <div className="text-center py-10">Loading rankings...</div>
                            ) : (
                                <RankTable entries={entries} />
                            )}
                        </TabsContent>
                    </Tabs>
                </div>

                <div className="space-y-6">
                    {/* Sidebar / Personal Stats */}
                    <LeagueView currentLeague="Gold" points={1250} rank={14} />

                    <div className="rounded-xl border bg-card p-6">
                        <h3 className="font-semibold mb-4">Your Stats</h3>
                        <div className="space-y-3">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Win Rate</span>
                                <span className="font-medium">64%</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Best Streak</span>
                                <span className="font-medium">8 🔥</span>
                            </div>
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Global Rank</span>
                                <span className="font-medium">#42</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
