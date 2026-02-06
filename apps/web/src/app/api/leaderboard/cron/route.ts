import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '@/lib/leaderboard/service';

export async function POST(req: NextRequest) {
    // Auth check needed here

    const service = new LeaderboardService();
    await service.processWeeklyLeagues();

    return NextResponse.json({ success: true, message: 'Leagues processed' });
}
