'use client';

import { Trophy } from 'lucide-react';

interface TopPositionsLeaderboardProps {
    marketId: string;
}

export function TopPositionsLeaderboard({ marketId }: TopPositionsLeaderboardProps) {
    return (
        <div className="flex flex-col items-center justify-center py-12 text-muted-foreground border border-dashed rounded-lg bg-slate-800/20">
            <Trophy className="w-12 h-12 mb-3 opacity-20" />
            <p className="text-sm font-medium">পজিশন র্যাংকিং লুড হচ্ছে...</p>
            <p className="text-xs opacity-60">শীঘ্রই এই ফিচারটি উন্মোচন করা হবে।</p>
        </div>
    );
}
