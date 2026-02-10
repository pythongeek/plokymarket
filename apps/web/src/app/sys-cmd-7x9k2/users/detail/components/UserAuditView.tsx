'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    History,
    User,
    Shield,
    Settings,
    TrendingUp,
    AlertTriangle,
    Loader2,
    Filter,
    RefreshCw,
    Clock,
} from 'lucide-react';
import { userManagementService, type AuditLogEntry } from '@/lib/user-management/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface UserAuditViewProps {
    userId: string;
}

export function UserAuditView({ userId }: UserAuditViewProps) {
    const [logs, setLogs] = useState<AuditLogEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState('all');

    useEffect(() => {
        loadAuditLogs();
    }, [userId, filter]);

    const loadAuditLogs = async () => {
        setLoading(true);
        try {
            const data = await userManagementService.getAuditLogs(
                userId,
                filter === 'all' ? undefined : filter,
            );
            setLogs(data);
        } catch (error) {
            console.error('Error loading audit logs:', error);
        } finally {
            setLoading(false);
        }
    };

    const getActionConfig = (action: string) => {
        const configs: Record<string, { icon: typeof Settings; color: string; label: string }> = {
            status_change: { icon: Settings, color: 'text-amber-400', label: 'স্ট্যাটাস পরিবর্তন' },
            login: { icon: User, color: 'text-blue-400', label: 'লগইন' },
            kyc_update: { icon: Shield, color: 'text-purple-400', label: 'KYC আপডেট' },
            trade: { icon: TrendingUp, color: 'text-emerald-400', label: 'ট্রেড' },
            intervention: { icon: AlertTriangle, color: 'text-red-400', label: 'হস্তক্ষেপ' },
            tier_change: { icon: Shield, color: 'text-violet-400', label: 'টিয়ার পরিবর্তন' },
            restriction: { icon: Settings, color: 'text-orange-400', label: 'সীমাবদ্ধতা' },
            profile_update: { icon: User, color: 'text-cyan-400', label: 'প্রোফাইল আপডেট' },
            withdrawal: { icon: TrendingUp, color: 'text-red-400', label: 'উত্তোলন' },
            deposit: { icon: TrendingUp, color: 'text-emerald-400', label: 'জমা' },
        };
        return configs[action] || { icon: Clock, color: 'text-slate-400', label: action };
    };

    return (
        <div className="space-y-6">
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="text-white text-sm flex items-center gap-2">
                                <History className="w-4 h-4 text-primary" />
                                অডিট ট্রেইল
                            </CardTitle>
                            <CardDescription className="text-slate-500">
                                সকল কার্যকলাপ লগ — All activity logs
                            </CardDescription>
                        </div>
                        <div className="flex items-center gap-2">
                            <Select value={filter} onValueChange={setFilter}>
                                <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-white">
                                    <Filter className="h-4 w-4 mr-2" />
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="all">সকল কার্যকলাপ</SelectItem>
                                    <SelectItem value="status_change">স্ট্যাটাস পরিবর্তন</SelectItem>
                                    <SelectItem value="login">লগইন</SelectItem>
                                    <SelectItem value="kyc_update">KYC আপডেট</SelectItem>
                                    <SelectItem value="trade">ট্রেড</SelectItem>
                                    <SelectItem value="intervention">হস্তক্ষেপ</SelectItem>
                                    <SelectItem value="tier_change">টিয়ার পরিবর্তন</SelectItem>
                                    <SelectItem value="restriction">সীমাবদ্ধতা</SelectItem>
                                </SelectContent>
                            </Select>
                            <Button
                                variant="outline"
                                size="icon"
                                onClick={loadAuditLogs}
                                disabled={loading}
                                className="border-slate-800 text-slate-400"
                            >
                                <RefreshCw className={cn("h-4 w-4", loading && "animate-spin")} />
                            </Button>
                        </div>
                    </div>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="h-8 w-8 animate-spin text-primary" />
                        </div>
                    ) : logs.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <History className="h-16 w-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">কোনো অডিট লগ পাওয়া যায়নি</p>
                            <p className="text-sm mt-1">No audit logs found</p>
                        </div>
                    ) : (
                        <div className="relative">
                            {/* Timeline line */}
                            <div className="absolute left-[19px] top-0 bottom-0 w-px bg-slate-800" />

                            <div className="space-y-1">
                                {logs.map((log, index) => {
                                    const config = getActionConfig(log.action);
                                    const Icon = config.icon;

                                    return (
                                        <motion.div
                                            key={log.id || index}
                                            initial={{ opacity: 0, x: -10 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.03 }}
                                            className="flex items-start gap-4 py-3 relative"
                                        >
                                            {/* Timeline dot */}
                                            <div className={cn(
                                                "w-10 h-10 rounded-full flex items-center justify-center shrink-0 z-10",
                                                `bg-slate-900 border border-slate-800`
                                            )}>
                                                <Icon className={cn("w-4 h-4", config.color)} />
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0 py-0.5">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div>
                                                        <div className="flex items-center gap-2 flex-wrap">
                                                            <Badge className={cn("text-[10px]", `bg-slate-800 ${config.color}`)}>
                                                                {config.label}
                                                            </Badge>
                                                            {log.ip_address && (
                                                                <span className="text-[10px] text-slate-600 font-mono">
                                                                    IP: {log.ip_address}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-sm text-white mt-1">{log.description || log.details}</p>
                                                        {log.metadata && (
                                                            <div className="flex gap-2 mt-1 flex-wrap">
                                                                {Object.entries(log.metadata).slice(0, 4).map(([key, value]) => (
                                                                    <span key={key} className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-500">
                                                                        {key}: {String(value)}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right shrink-0">
                                                        <p className="text-[10px] text-slate-500">
                                                            {new Date(log.created_at).toLocaleDateString('bn-BD')}
                                                        </p>
                                                        <p className="text-[10px] text-slate-600">
                                                            {new Date(log.created_at).toLocaleTimeString('bn-BD', { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                        {log.performed_by && (
                                                            <p className="text-[10px] text-slate-600 mt-0.5">
                                                                {log.performed_by}
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
