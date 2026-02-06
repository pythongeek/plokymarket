import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

interface LeaderboardEntry {
    rank: number;
    users: {
        username: string;
        full_name: string;
        avatar_url: string;
    };
    total_pnl: number;
    win_rate: number;
    current_streak: number;
    roi: number;
}

export function RankTable({ entries }: { entries: LeaderboardEntry[] }) {
    return (
        <div className="rounded-md border">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[100px]">Rank</TableHead>
                        <TableHead>Trader</TableHead>
                        <TableHead className="text-right">PnL (BDT)</TableHead>
                        <TableHead className="text-right">ROI</TableHead>
                        <TableHead className="text-right">Win Rate</TableHead>
                        <TableHead className="text-center">Streak</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {entries.map((entry) => (
                        <TableRow key={entry.rank}>
                            <TableCell className="font-medium">
                                {entry.rank === 1 && '🥇'}
                                {entry.rank === 2 && '🥈'}
                                {entry.rank === 3 && '🥉'}
                                {entry.rank > 3 && `#${entry.rank}`}
                            </TableCell>
                            <TableCell>
                                <div className="flex items-center gap-2">
                                    <Avatar className="h-8 w-8">
                                        <AvatarImage src={entry.users.avatar_url} />
                                        <AvatarFallback>{entry.users.username?.substring(0, 2)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex flex-col">
                                        <span className="font-medium">{entry.users.full_name}</span>
                                        <span className="text-xs text-muted-foreground">@{entry.users.username}</span>
                                    </div>
                                </div>
                            </TableCell>
                            <TableCell className={`text-right ${entry.total_pnl >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                                ৳{entry.total_pnl.toLocaleString()}
                            </TableCell>
                            <TableCell className="text-right">{entry.roi}%</TableCell>
                            <TableCell className="text-right">{entry.win_rate}%</TableCell>
                            <TableCell className="text-center">
                                {entry.current_streak > 2 && <span className="mr-1">🔥</span>}
                                {entry.current_streak}
                            </TableCell>
                        </TableRow>
                    ))}
                </TableBody>
            </Table>
        </div>
    );
}
