import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Market } from '@/types';
import { Info, ExternalLink, Activity, ShieldCheck, UserCheck } from 'lucide-react';
import { format } from 'date-fns';

interface MarketInfoPanelProps {
    market: Market;
}

export function MarketInfoPanel({ market }: MarketInfoPanelProps) {
    return (
        <Card className="border shadow-sm bg-card text-card-foreground">
            <CardHeader className="pb-3 border-b border-border/50 bg-muted/20">
                <CardTitle className="text-sm font-semibold flex items-center gap-2">
                    <Info className="w-4 h-4 text-primary" />
                    Market Information
                </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 text-sm">

                {/* Resolution Criteria */}
                <div className="space-y-1">
                    <div className="flex items-center gap-2 text-muted-foreground font-medium">
                        <Activity className="w-3.5 h-3.5" />
                        <span className="text-xs uppercase tracking-wider">Resolution Criteria</span>
                    </div>
                    <p className="leading-relaxed text-sm">
                        {market.resolution_criteria || 'This market resolves to YES if the specified conditions are met before the trading period closes. Otherwise, it resolves to NO.'}
                    </p>
                </div>

                <div className="border-t border-border/50 my-2" />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    {/* Resolution Source */}
                    <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Resolution Source</span>
                        <div className="flex items-center gap-1">
                            {market.resolution_source ? (
                                <a
                                    href={market.resolution_source.startsWith('http') ? market.resolution_source : `https://${market.resolution_source}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-blue-500 hover:text-blue-400 font-medium inline-flex items-center break-all"
                                >
                                    {market.resolution_source.replace(/^https?:\/\//, '')}
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                </a>
                            ) : (
                                <span className="text-foreground">Official Announcement</span>
                            )}
                        </div>
                    </div>

                    {/* Resolution Date */}
                    <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Resolution Date</span>
                        <div>
                            {market.trading_closes_at
                                ? format(new Date(market.trading_closes_at), 'MMMM d, yyyy - h:mm a')
                                : 'TBD'}
                        </div>
                    </div>

                    {/* Oracle Details */}
                    <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3" /> Oracle
                        </span>
                        <div>
                            <a
                                href={`https://etherscan.io/address/0x0000000000000000000000000000000000000000`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline inline-flex items-center p-0.5 rounded"
                            >
                                Polymarket Oracle
                                <ExternalLink className="w-3 h-3 ml-1" />
                            </a>
                        </div>
                    </div>

                    {/* Creator */}
                    <div className="space-y-1">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium flex items-center gap-1">
                            <UserCheck className="w-3 h-3" /> Creator
                        </span>
                        <div className="flex items-center gap-2">
                            <span className="font-medium text-foreground">Plokymarket BD</span>
                            <Badge variant="secondary" className="text-[10px] bg-emerald-500/10 text-emerald-500 border-none px-1.5 py-0 leading-tight">Verified</Badge>
                        </div>
                    </div>

                </div>

                {/* Historical Mini Chart Placeholder (To be implemented with Recharts/Canvas) */}
                <div className="border-t border-border/50 pt-4 mt-2">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-xs uppercase tracking-wider text-muted-foreground font-medium">Historical Price (7-Day)</span>
                        <div className="flex gap-1">
                            {['1D', '7D', '1M', 'ALL'].map(tf => (
                                <Badge key={tf} variant="outline" className={`text-[10px] cursor-pointer hover:bg-muted ${tf === '7D' ? 'bg-primary/10 border-primary text-primary' : ''}`}>
                                    {tf}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    <div className="h-24 w-full bg-muted/30 rounded-lg border border-border/50 flex items-center justify-center relative overflow-hidden group">
                        {/* Pseudo-chart line for mockup */}
                        <svg className="absolute inset-0 w-full h-full text-blue-500/50" preserveAspectRatio="none" viewBox="0 0 100 100">
                            <path d="M0,80 Q10,70 20,80 T40,60 T60,50 T80,30 T100,40" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                            <path d="M0,80 Q10,70 20,80 T40,60 T60,50 T80,30 T100,40 L100,100 L0,100 Z" fill="currentColor" fillOpacity="0.1" />
                        </svg>

                        {/* Volume Bars */}
                        <div className="absolute bottom-0 left-0 w-full h-1/3 flex items-end justify-between px-2 gap-1 opacity-40">
                            {[4, 7, 3, 8, 5, 9, 2, 6, 8, 4, 10, 5, 7].map((h, i) => (
                                <div key={i} className="bg-slate-500 w-full rounded-t-sm" style={{ height: `${h * 10}%` }}></div>
                            ))}
                        </div>

                        <span className="text-xs text-muted-foreground z-10 font-medium group-hover:opacity-0 transition-opacity">Chart Data Loading...</span>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
