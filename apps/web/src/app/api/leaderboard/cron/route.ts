import { NextRequest, NextResponse } from 'next/server';
import { LeaderboardService } from '@/lib/leaderboard/service';
import { verifyQStashSignature } from '@/lib/qstash/verify';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
    // Verify QStash signature (cron job protection)
    const isValid = await verifyQStashSignature(req);
    if (!isValid) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const service = new LeaderboardService();
    await service.processWeeklyLeagues();

    return NextResponse.json({ success: true, message: 'Leagues processed' });
}
