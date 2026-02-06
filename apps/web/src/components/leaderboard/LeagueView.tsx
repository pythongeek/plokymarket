import { Progress } from '@/components/ui/progress';

export function LeagueView({ currentLeague, points, rank }: { currentLeague: string, points: number, rank: number }) {
    // Mock thresholds for demo
    const promotionZone = 20; // Top 20 promote
    const relegationZone = 80; // Bottom 20 demote

    return (
        <div className="p-6 rounded-xl bg-gradient-to-br from-indigo-900 to-slate-900 text-white shadow-lg relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute top-0 right-0 p-4 opacity-10">
                <img src={`/badges/${currentLeague.toLowerCase()}_league.png`} className="w-32 h-32" alt="League" />
            </div>

            <h2 className="text-2xl font-bold mb-2 flex items-center gap-2">
                {currentLeague} League
            </h2>

            <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                    <span>Current Rank: #{rank}</span>
                    <span className="text-green-400">Promotion Zone: Top {promotionZone}</span>
                </div>
                <Progress value={Math.max(10, 100 - rank)} className="h-2 bg-slate-700" />
            </div>

            <div className="flex gap-4 text-sm text-slate-300">
                <div>
                    <span className="block font-bold text-white text-lg">{points}</span>
                    Points
                </div>
                <div>
                    <span className="block font-bold text-white text-lg">2d 14h</span>
                    Season Ends
                </div>
            </div>
        </div>
    );
}
