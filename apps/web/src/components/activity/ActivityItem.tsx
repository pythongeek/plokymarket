'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { ArrowUpRight, Trophy, MessageSquare, Plus, CheckCircle, TrendingUp } from 'lucide-react';

export function ActivityItem({ activity }: { activity: any }) {
    const { users, type, data, created_at } = activity;
    const timeInfo = new Date(created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let Icon = TrendingUp;
    let colorClass = "text-blue-500 bg-blue-500/10";
    let message = "";

    switch (type) {
        case 'TRADE':
            Icon = ArrowUpRight;
            colorClass = "text-green-500 bg-green-500/10";
            message = (
                <span>
                    bought <strong>{data.outcome}</strong> in <span className="text-primary">{data.marketQuestion}</span>
                </span>
            );
            break;
        case 'MARKET_RESOLVE':
            Icon = CheckCircle;
            colorClass = "text-purple-500 bg-purple-500/10";
            message = (
                <span>
                    Market <span className="text-primary">{data.marketQuestion}</span> resolved to <strong>{data.outcome}</strong>
                </span>
            );
            break;
        case 'LEAGUE_UP':
            Icon = Trophy;
            colorClass = "text-amber-500 bg-amber-500/10";
            message = (
                <span>
                    promoted to <strong>{data.newLeague} League</strong>! 🏆
                </span>
            );
            break;
        case 'COMMENT':
            Icon = MessageSquare;
            colorClass = "text-slate-500 bg-slate-500/10";
            message = (
                <span>
                    commented on <span className="text-primary">{data.marketQuestion}</span>
                </span>
            );
            break;
        default:
            message = <span>performed an action</span>;
    }

    return (
        <Card className="p-4 flex items-start gap-4 hover:bg-muted/50 transition-colors">
            <div className={`p-2 rounded-full ${colorClass}`}>
                <Icon className="w-5 h-5" />
            </div>

            <div className="flex-1 space-y-1">
                <div className="flex items-center gap-2">
                    <Avatar className="w-6 h-6">
                        <AvatarImage src={users?.avatar_url} />
                        <AvatarFallback>{users?.username?.[0] || 'U'}</AvatarFallback>
                    </Avatar>
                    <span className="font-semibold text-sm">{users?.full_name || 'Someone'}</span>
                    <span className="text-xs text-muted-foreground">• {timeInfo}</span>
                </div>
                <p className="text-sm text-foreground/90 leading-relaxed">
                    {message}
                </p>
            </div>
        </Card>
    );
}
