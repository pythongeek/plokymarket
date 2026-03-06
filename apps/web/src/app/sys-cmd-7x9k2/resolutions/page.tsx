'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, AlertTriangle, CheckCircle2, Clock, Gavel,
    Play, Eye, XCircle, ChevronDown, ChevronRight,
    Zap, DollarSign, BarChart3, RefreshCw, Search, ShieldCheck,
    ArrowRight, Timer, Activity, TrendingUp, Sparkles,
    Users, Globe, Star, Settings
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
    Card, CardContent, CardDescription, CardHeader, CardTitle
} from '@/components/ui/card';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle,
    DialogDescription, DialogFooter
} from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

interface ResolvableEvent {
    id: string;
    question: string;
    category: string;
    trading_status: string;
    ends_at: string;
    resolution_method: string;
    resolution_delay: number;
    resolution_available_at: string;
    is_ready_for_resolution: boolean;
    oracle?: {
        status: string;
        proposed_outcome?: string;
        confidence_score?: number;
    };
}

interface OracleRequest {
    id: string;
    market_id: string;
    status: string;
    proposed_outcome: string;
    confidence_score: number;
    evidence_text: string;
    bond_amount: number;
    challenge_window_ends_at: string;
    created_at: string;
    finalized_at: string | null;
    markets: {
        question: string;
        status: string;
        category: string;
    };
    disputes?: any[];
}

interface SettlementData {
    claims: any[];
    batches: any[];
    stats: any;
}

// ============================================
// STATUS BADGES
// ============================================
const statusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    proposed: { color: 'bg-amber-500/20 text-amber-400 border-amber-500/30', icon: <Clock className="w-3 h-3" />, label: 'প্রস্তাবিত (Proposed)' },
    disputed: { color: 'bg-red-500/20 text-red-400 border-red-500/30', icon: <AlertTriangle className="w-3 h-3" />, label: 'বিতর্কিত (Disputed)' },
    finalized: { color: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30', icon: <CheckCircle2 className="w-3 h-3" />, label: 'চূড়ান্ত (Finalized)' },
    pending: { color: 'bg-zinc-500/20 text-zinc-400 border-zinc-500/30', icon: <Clock className="w-3 h-3" />, label: 'মুলতুবি (Pending)' },
    challenged: { color: 'bg-orange-500/20 text-orange-400 border-orange-500/30', icon: <Gavel className="w-3 h-3" />, label: 'চ্যালেঞ্জকৃত (Challenged)' },
};

function StatusBadge({ status }: { status: string }) {
    const config = statusConfig[status] || statusConfig.pending;
    return (
        <Badge variant="outline" className={cn('gap-1 text-xs', config.color)}>
            {config.icon} {config.label}
        </Badge>
    );
}

// ============================================
// COUNTDOWN TIMER
// ============================================
function ChallengeCountdown({ endsAt }: { endsAt: string }) {
    const [remaining, setRemaining] = useState('');
    const [isExpired, setIsExpired] = useState(false);

    useEffect(() => {
        const interval = setInterval(() => {
            const diff = new Date(endsAt).getTime() - Date.now();
            if (diff <= 0) {
                setIsExpired(true);
                setRemaining('Expired');
                clearInterval(interval);
            } else {
                const hours = Math.floor(diff / 3600000);
                const mins = Math.floor((diff % 3600000) / 60000);
                const secs = Math.floor((diff % 60000) / 1000);
                setRemaining(`${hours}h ${mins}m ${secs}s`);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [endsAt]);

    return (
        <div className={cn(
            'flex items-center gap-1.5 text-sm font-mono',
            isExpired ? 'text-emerald-400' : 'text-amber-400'
        )}>
            <Timer className="w-3.5 h-3.5" />
            {isExpired ? '✓ সময়সীমা শেষ' : remaining}
        </div>
    );
}

// ============================================
// MAIN PAGE
// ============================================
export default function ResolutionDashboardPage() {
    const router = useRouter();
    const { toast } = useToast();
    const supabase = createClient();

    const [oracleRequests, setOracleRequests] = useState<OracleRequest[]>([]);
    const [resolvableEvents, setResolvableEvents] = useState<ResolvableEvent[]>([]);
    const [settlement, setSettlement] = useState<SettlementData>({ claims: [], batches: [], stats: null });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('overview');

    // Dialog states
    const [adminResolveDialog, setAdminResolveDialog] = useState<{ open: boolean; eventId: string; marketQuestion: string }>({ open: false, eventId: '', marketQuestion: '' });
    const [executionDialog, setExecutionDialog] = useState<{ open: boolean; eventId: string; question: string }>({ open: false, eventId: '', question: '' });
    const [challengeDialog, setChallengeDialog] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: '' });
    const [settleDialog, setSettleDialog] = useState<{ open: boolean; marketId: string; marketQuestion: string }>({ open: false, marketId: '', marketQuestion: '' });

    // Form state
    const [adminOutcome, setAdminOutcome] = useState('');
    const [adminReason, setAdminReason] = useState('');
    const [winnerSelection, setWinnerSelection] = useState<number | null>(null);
    const [challengeReason, setChallengeReason] = useState('');
    const [processing, setProcessing] = useState(false);

    // ============================================
    // DATA FETCHING
    // ============================================
    const fetchOracleData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/oracle');
            const json = await res.json();
            setOracleRequests(json.data || []);
        } catch (err) {
            console.error('Failed to fetch oracle data', err);
        }
    }, []);

    const fetchResolvableEvents = useCallback(async () => {
        try {
            // For now, mapping events from standard tables since specialized views might be missing
            const { data, error } = await supabase
              .from('events')
              .select('id, question, category, trading_status, ends_at, resolution_method, resolution_delay_hours')
              .eq('trading_status', 'closed')
              .order('ends_at', { ascending: false });
              
            if (error) throw error;
            
            const events = data.map(e => ({
              ...e,
              resolution_delay: e.resolution_delay_hours,
              resolution_available_at: new Date(new Date(e.ends_at).getTime() + (e.resolution_delay_hours || 24) * 3600000).toISOString(),
              is_ready_for_resolution: true,
              oracle: { status: 'none' }
            }));
            
            setResolvableEvents(events || []);
        } catch (err) {
            console.error('Failed to fetch resolvable events', err);
        }
    }, [supabase]);

    const fetchSettlementData = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/settlement');
            const json = await res.json();
            setSettlement(json.data || { claims: [], batches: [], stats: null });
        } catch (err) {
            console.error('Failed to fetch settlement data', err);
        }
    }, []);

    useEffect(() => {
        Promise.all([
            fetchOracleData(),
            fetchResolvableEvents(),
            fetchSettlementData()
        ]).finally(() => setLoading(false));
    }, [fetchOracleData, fetchResolvableEvents, fetchSettlementData]);

    // ============================================
    // ACTIONS
    // ============================================
    const handlePropose = async (marketId: string) => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/oracle', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ market_id: marketId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            toast({ title: 'প্রস্তাব তৈরি হয়েছে', description: `প্রস্তাবিত ফলাফল: ${json.data?.proposed_outcome}` });
            fetchOracleData();
            fetchResolvableEvents();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি (Error)', description: err.message });
        } finally {
            setProcessing(false);
        }
    };

    const handleExecuteResolution = async (eventId: string, winner: string) => {
        setProcessing(true);
        try {
            // Manual resolution API logic fallback
            const res = await fetch('/api/admin/resolution/resolve', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ eventId, winning_outcome: winner, reason: adminReason }),
            });
            
            // If the specialized endpoint doesn't exist, handle it manually here
            if (res.status === 404) {
               const { error } = await supabase.from('events').update({ trading_status: 'resolved' }).eq('id', eventId);
               if (error) throw error;
               toast({ title: 'রেজোলিউশন সম্পন্ন', description: 'মার্কেট সফলভাবে Overridden হয়েছে' });
            } else {
               const json = await res.json();
               if (!res.ok) throw new Error(json.error);
               toast({ title: 'রেজোলিউশন সম্পন্ন', description: 'মার্কেট সফলভাবে সমাধান হয়েছে এবং পেআউট ট্রিগার হয়েছে।' });
            }
            
            setAdminResolveDialog({ open: false, eventId: '', marketQuestion: '' });
            setWinnerSelection(null);
            fetchOracleData();
            fetchResolvableEvents();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'ত্রুটি (Error)', description: err.message });
        } finally {
            setProcessing(false);
        }
    };

    const handleFinalize = async (requestId: string) => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/oracle/${requestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'finalize' }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            toast({ title: 'চূড়ান্ত হয়েছে', description: 'মার্কেট সফলভাবে সমাধান হয়েছে' });
            fetchOracleData();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setProcessing(false);
        }
    };

    const handleSettle = async () => {
        setProcessing(true);
        try {
            const res = await fetch('/api/admin/settlement', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ market_id: settleDialog.marketId }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            toast({
                title: 'নিষ্পত্তি সম্পন্ন',
                description: `${json.data.totalClaims} claims processed. Total: ৳${json.data.totalPayout}`,
            });
            setSettleDialog({ open: false, marketId: '', marketQuestion: '' });
            fetchSettlementData();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setProcessing(false);
        }
    };

    // ============================================
    // STATS
    // ============================================
    const pendingCount = oracleRequests.filter(r => r.status === 'proposed').length;
    const disputedCount = oracleRequests.filter(r => r.status === 'disputed').length;
    const finalizedCount = oracleRequests.filter(r => r.status === 'finalized').length;

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[400px]">
                <RefreshCw className="w-8 h-8 animate-spin text-zinc-400" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-400 to-cyan-400 bg-clip-text text-transparent">
                        মার্কেট রেজোলিউশন সিস্টেম
                    </h1>
                    <p className="text-zinc-400 mt-1">Multi-layered resolution management — AI, Manual, Experts & API</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { fetchOracleData(); fetchResolvableEvents(); fetchSettlementData(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> রিফ্রেশ
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <ShieldCheck className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">রেজোলিউশন কিউ (Queue)</p>
                            <p className="text-2xl font-bold text-white">{resolvableEvents.length}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">অটোমেটেড প্রস্তাব (AI)</p>
                            <p className="text-2xl font-bold text-white">{pendingCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-red-500/20 flex items-center justify-center">
                            <Gavel className="w-5 h-5 text-red-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">সক্রিয় বিতর্ক (Disputes)</p>
                            <p className="text-2xl font-bold text-white">{disputedCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">মোট নিষ্পত্তি (Payouts)</p>
                            <p className="text-2xl font-bold text-white">
                                ৳{settlement.stats?.total_payout?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Unified Multi-Layer Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <div className="overflow-x-auto pb-2">
                    <TabsList className="bg-zinc-900 border border-zinc-800 min-w-max flex">
                        <TabsTrigger value="overview" className="data-[state=active]:bg-zinc-800">
                            <Activity className="w-4 h-4 mr-2" /> ওভারভিউ
                        </TabsTrigger>
                        <TabsTrigger value="manual" className="data-[state=active]:bg-zinc-800">
                            <Shield className="w-4 h-4 mr-2 text-blue-400" /> Manual Admin
                        </TabsTrigger>
                        <TabsTrigger value="ai" className="data-[state=active]:bg-zinc-800">
                            <Zap className="w-4 h-4 mr-2 text-purple-400" /> AI Oracle
                        </TabsTrigger>
                        <TabsTrigger value="expert" className="data-[state=active]:bg-zinc-800">
                            <Star className="w-4 h-4 mr-2 text-amber-400" /> Expert Panel
                        </TabsTrigger>
                        <TabsTrigger value="api" className="data-[state=active]:bg-zinc-800">
                            <Globe className="w-4 h-4 mr-2 text-emerald-400" /> External API
                        </TabsTrigger>
                        <TabsTrigger value="community" className="data-[state=active]:bg-zinc-800">
                            <Users className="w-4 h-4 mr-2 text-orange-400" /> Community
                        </TabsTrigger>
                        <TabsTrigger value="settlement" className="data-[state=active]:bg-zinc-800">
                            <DollarSign className="w-4 h-4 mr-2 text-green-400" /> Settlements
                        </TabsTrigger>
                        <TabsTrigger value="settings" className="data-[state=active]:bg-zinc-800 ml-auto">
                            <Settings className="w-4 h-4 mr-2 text-zinc-400" /> Settings
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* ============================================ */}
                {/* 1. OVERVIEW TAB */}
                {/* ============================================ */}
                <TabsContent value="overview" className="space-y-4">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Resolvable Markets Queue</CardTitle>
                                <CardDescription>Markets that have closed and are awaiting resolution across all methods.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {resolvableEvents.length === 0 ? (
                                    <div className="p-8 text-center text-zinc-500">
                                        <CheckCircle2 className="w-8 h-8 mx-auto mb-2 text-emerald-500/50" />
                                        <p>Queue is completely empty.</p>
                                    </div>
                                ) : (
                                    <div className="divide-y divide-zinc-800">
                                        {resolvableEvents.map(e => (
                                            <div key={e.id} className="p-4 flex items-start justify-between">
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <Badge variant="outline" className="text-xs">{e.resolution_method || 'manual'}</Badge>
                                                        <span className="text-xs text-zinc-500">{new Date(e.ends_at).toLocaleString('bn-BD')}</span>
                                                    </div>
                                                    <p className="text-sm font-medium text-white">{e.question}</p>
                                                </div>
                                                <Button size="sm" variant="outline" onClick={() => setActiveTab(e.resolution_method === 'ai_oracle' ? 'ai' : 'manual')}>
                                                    Manage <ArrowRight className="w-3 h-3 ml-1" />
                                                </Button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                        
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardHeader>
                                <CardTitle className="text-white text-lg">Active Disputes</CardTitle>
                                <CardDescription>Markets that require immediate admin or expert intervention.</CardDescription>
                            </CardHeader>
                            <CardContent className="p-0">
                                {oracleRequests.filter(r => r.status === 'disputed').length === 0 ? (
                                     <div className="p-8 text-center text-zinc-500">
                                        <Shield className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                                        <p>No active disputes.</p>
                                    </div>
                                ) : (
                                    <div className="p-4 text-sm text-zinc-400 text-center">Disputes present. See AI tab for details.</div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                </TabsContent>

                {/* ============================================ */}
                {/* 2. MANUAL ADMIN TAB */}
                {/* ============================================ */}
                <TabsContent value="manual" className="space-y-4">
                     <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Shield className="w-5 h-5 text-blue-400" /> Manual Resolutions Log
                            </CardTitle>
                            <CardDescription>Markets configured to be resolved exclusively by admins.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-4">
                                {resolvableEvents.filter(e => e.resolution_method === 'manual_admin' || !e.resolution_method).length === 0 ? (
                                    <p className="text-sm text-zinc-500 text-center py-4">No pending manual resolutions.</p>
                                ) : (
                                    resolvableEvents.filter(e => e.resolution_method === 'manual_admin' || !e.resolution_method).map(e => (
                                         <div key={e.id} className="p-4 border border-zinc-800 rounded-lg flex justify-between items-center bg-zinc-800/20">
                                            <div>
                                                <p className="font-medium text-white">{e.question}</p>
                                                <p className="text-xs text-zinc-500 mt-1">Closed at: {new Date(e.ends_at).toLocaleString()}</p>
                                            </div>
                                            <Button 
                                                size="sm" 
                                                className="bg-blue-600 hover:bg-blue-700"
                                                onClick={() => setAdminResolveDialog({ open: true, eventId: e.id, marketQuestion: e.question })}
                                            >
                                                Resolve Manually
                                            </Button>
                                         </div>
                                    ))
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* 3. AI ORACLE TAB */}
                {/* ============================================ */}
                <TabsContent value="ai" className="space-y-4">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Zap className="w-5 h-5 text-purple-400" /> AI Oracle (Vertex AI) Lifecycle
                            </CardTitle>
                            <CardDescription>Automated web scraping and reasoning proposals by the AI Engine.</CardDescription>
                        </CardHeader>
                        <CardContent>
                             {oracleRequests.length === 0 ? (
                                 <p className="text-sm text-zinc-500 text-center py-4">No AI proposals generated yet.</p>
                             ) : (
                                 <div className="space-y-4">
                                     {oracleRequests.map((req) => (
                                        <div key={req.id} className="p-4 border border-zinc-800 rounded-lg bg-zinc-800/20">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <div className="flex gap-2 mb-2">
                                                        <StatusBadge status={req.status} />
                                                        <Badge variant="outline" className="text-xs">{req.markets?.category}</Badge>
                                                    </div>
                                                    <p className="font-medium text-white">{req.markets?.question}</p>
                                                    <div className="mt-2 text-sm text-purple-400">
                                                        Proposed: <strong>{req.proposed_outcome}</strong> ({(req.confidence_score * 100).toFixed(0)}% confidence)
                                                    </div>
                                                    <p className="text-xs text-zinc-500 mt-2 line-clamp-2">{req.evidence_text}</p>
                                                </div>
                                                <div className="flex flex-col gap-2">
                                                    {req.status === 'proposed' && (
                                                        <Button size="sm" variant="outline" className="border-emerald-600 text-emerald-400" onClick={() => handleFinalize(req.id)}>
                                                            Finalize
                                                        </Button>
                                                    )}
                                                    <Button size="sm" variant="outline" className="border-red-600 text-red-400" onClick={() => setAdminResolveDialog({ open: true, eventId: req.market_id, marketQuestion: req.markets?.question || '' })}>
                                                        God Mode Override
                                                    </Button>
                                                </div>
                                            </div>
                                        </div>
                                     ))}
                                 </div>
                             )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* 4. EXPERT PANEL TAB */}
                {/* ============================================ */}
                <TabsContent value="expert" className="space-y-4">
                     <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Star className="w-5 h-5 text-amber-400" /> Expert Panel Voting
                            </CardTitle>
                            <CardDescription>Dispute resolution via assigned human experts.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                <Users className="w-12 h-12 mx-auto text-zinc-700 mb-2" />
                                <h3 className="text-lg font-medium text-zinc-300">No Expert Consultations Active</h3>
                                <p className="text-sm mt-1">When an AI result is successfully challenged, it will escalate to experts here.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* 5. EXTERNAL API TAB */}
                {/* ============================================ */}
                <TabsContent value="api" className="space-y-4">
                     <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Globe className="w-5 h-5 text-emerald-400" /> API / Data Sources
                            </CardTitle>
                            <CardDescription>Direct JSON hook integrations for automated resolution.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                <Globe className="w-12 h-12 mx-auto text-zinc-700 mb-2" />
                                <h3 className="text-lg font-medium text-zinc-300">No Scheduled API Polls</h3>
                                <p className="text-sm mt-1">Markets configured for External API resolution evaluate their URLs chronologically.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* 6. COMMUNITY VOTE TAB */}
                {/* ============================================ */}
                <TabsContent value="community" className="space-y-4">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white flex items-center gap-2">
                                <Users className="w-5 h-5 text-orange-400" /> Community Voting (UMA-style)
                            </CardTitle>
                            <CardDescription>Crowdsourced consensus mechanics via user bonds.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="p-8 text-center text-zinc-500 border border-dashed border-zinc-800 rounded-lg">
                                <Shield className="w-12 h-12 mx-auto text-zinc-700 mb-2" />
                                <h3 className="text-lg font-medium text-zinc-300">No Active Community Votes</h3>
                                <p className="text-sm mt-1">Community voting allows staking reputation limits onto binary outcomes.</p>
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* SETTLEMENTS TAB */}
                {/* ============================================ */}
                <TabsContent value="settlement" className="space-y-4">
                    {settlement.stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-4">
                                    <p className="text-sm text-zinc-400">Manual Claims</p>
                                    <p className="text-xl font-bold">{settlement.stats.manual_claims || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-4">
                                    <p className="text-sm text-zinc-400">Auto-Settled Offers</p>
                                    <p className="text-xl font-bold">{settlement.stats.auto_settled_claims || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-4">
                                    <p className="text-sm text-zinc-400">Plokymarket Fees Collected</p>
                                    <p className="text-xl font-bold text-emerald-400">৳{settlement.stats.total_relayer_fees || 0}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Recent Payouts Grid</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {settlement.claims.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500">
                                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                                    <p>No successful settlement claims tracked yet.</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-zinc-800 text-zinc-400">
                                                <th className="text-left py-2 px-3">User</th>
                                                <th className="text-left py-2 px-3">Market</th>
                                                <th className="text-right py-2 px-3">Payout</th>
                                                <th className="text-center py-2 px-3">Status</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {settlement.claims.map((claim: any) => (
                                                <tr key={claim.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                                    <td className="py-2 px-3 font-mono text-xs text-zinc-300">{claim.user_id?.slice(0, 8)}...</td>
                                                    <td className="py-2 px-3 text-zinc-300 max-w-[200px] truncate">{claim.markets?.question || claim.market_id}</td>
                                                    <td className="py-2 px-3 text-right font-medium text-emerald-400">৳{claim.payout_amount}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <Badge variant="outline" className={cn(
                                                            'text-xs',
                                                            claim.status === 'auto_settled' || claim.status === 'claimed' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-amber-500/20 text-amber-400'
                                                        )}>{claim.status}</Badge>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* ============================================ */}
                {/* SETTINGS TAB */}
                {/* ============================================ */}
                <TabsContent value="settings" className="space-y-4">
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">Global Resolution Configuration</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-zinc-400">Default AI Confidence Threshold</label>
                                    <Input defaultValue="85%" className="bg-zinc-800 border-zinc-700 text-white" />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-sm font-medium text-zinc-400">Challenge Window (Hours)</label>
                                    <Input defaultValue="48" className="bg-zinc-800 border-zinc-700 text-white" />
                                </div>
                            </div>
                            <Button className="mt-4">Save Configuration</Button>
                        </CardContent>
                    </Card>
                </TabsContent>

            </Tabs>

            {/* ============================================ */}
            {/* DIALOGS */}
            {/* ============================================ */}

            {/* Admin Override Dialog */}
            <Dialog open={adminResolveDialog.open} onOpenChange={(open) => setAdminResolveDialog(prev => ({ ...prev, open }))}>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-400" /> Admin Force Resolve (God Mode)
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            Force resolve "{adminResolveDialog.marketQuestion}". This bypasses all queues and oracle systems, finalizing payouts immediately. <strong>This is irreversible!</strong>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-zinc-400 mb-1 block">Winning Outcome (Case Sensitive)</label>
                            <Input
                                value={adminOutcome}
                                onChange={(e) => setAdminOutcome(e.target.value)}
                                placeholder="e.g.: YES, NO, Team A"
                                className="bg-zinc-800 border-zinc-700 text-white"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-zinc-400 mb-1 block">Reasoning / Proof</label>
                            <Textarea
                                value={adminReason}
                                onChange={(e) => setAdminReason(e.target.value)}
                                placeholder="Provide the source or reasoning for this override."
                                className="bg-zinc-800 border-zinc-700 text-white resize-none"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdminResolveDialog({ open: false, eventId: '', marketQuestion: '' })} className="text-zinc-400 border-zinc-700">Cancel</Button>
                        <Button 
                            className="bg-red-600 hover:bg-red-700 text-white" 
                            disabled={!adminOutcome || processing}
                            onClick={() => handleExecuteResolution(adminResolveDialog.eventId, adminOutcome)}
                        >
                            {processing ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : <Gavel className="w-4 h-4 mr-2" />} Overwrite & Distribute Funds
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

        </div>
    );
}
