'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Shield, AlertTriangle, CheckCircle2, Clock, Gavel,
    Play, Eye, XCircle, ChevronDown, ChevronRight,
    Zap, DollarSign, BarChart3, RefreshCw, Search,
    ArrowRight, Timer, Activity, TrendingUp
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

// Types
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

    const [oracleRequests, setOracleRequests] = useState<OracleRequest[]>([]);
    const [settlement, setSettlement] = useState<SettlementData>({ claims: [], batches: [], stats: null });
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('resolution');

    // Dialog states
    const [adminResolveDialog, setAdminResolveDialog] = useState<{ open: boolean; requestId: string; marketQuestion: string }>({ open: false, requestId: '', marketQuestion: '' });
    const [challengeDialog, setChallengeDialog] = useState<{ open: boolean; requestId: string }>({ open: false, requestId: '' });
    const [settleDialog, setSettleDialog] = useState<{ open: boolean; marketId: string; marketQuestion: string }>({ open: false, marketId: '', marketQuestion: '' });

    // Form state
    const [adminOutcome, setAdminOutcome] = useState('');
    const [adminReason, setAdminReason] = useState('');
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
        Promise.all([fetchOracleData(), fetchSettlementData()]).finally(() => setLoading(false));
    }, [fetchOracleData, fetchSettlementData]);

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

    const handleChallenge = async () => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/oracle/${challengeDialog.requestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ action: 'challenge', reason: challengeReason }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            toast({ title: 'চ্যালেঞ্জ দাখিল হয়েছে', description: 'বিতর্ক তৈরি করা হয়েছে' });
            setChallengeDialog({ open: false, requestId: '' });
            setChallengeReason('');
            fetchOracleData();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'Error', description: err.message });
        } finally {
            setProcessing(false);
        }
    };

    const handleAdminResolve = async () => {
        setProcessing(true);
        try {
            const res = await fetch(`/api/admin/oracle/${adminResolveDialog.requestId}/admin-resolve`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ winning_outcome: adminOutcome, reason: adminReason }),
            });
            const json = await res.json();
            if (!res.ok) throw new Error(json.error);
            toast({ title: 'অ্যাডমিন ওভাররাইড সম্পন্ন', description: `ফলাফল: ${adminOutcome}` });
            setAdminResolveDialog({ open: false, requestId: '', marketQuestion: '' });
            setAdminOutcome('');
            setAdminReason('');
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
                        রেজোলিউশন ও নিষ্পত্তি
                    </h1>
                    <p className="text-zinc-400 mt-1">ট্রুথ ইঞ্জিন — ওরাকল প্রস্তাব, বিতর্ক এবং পেআউট পরিচালনা করুন</p>
                </div>
                <Button variant="outline" size="sm" onClick={() => { fetchOracleData(); fetchSettlementData(); }}>
                    <RefreshCw className="w-4 h-4 mr-2" /> রিফ্রেশ
                </Button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-amber-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">মুলতুবি প্রস্তাব</p>
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
                            <p className="text-sm text-zinc-400">সক্রিয় বিতর্ক</p>
                            <p className="text-2xl font-bold text-white">{disputedCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">চূড়ান্ত</p>
                            <p className="text-2xl font-bold text-white">{finalizedCount}</p>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-zinc-900/50 border-zinc-800">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                            <DollarSign className="w-5 h-5 text-violet-400" />
                        </div>
                        <div>
                            <p className="text-sm text-zinc-400">মোট নিষ্পত্তি</p>
                            <p className="text-2xl font-bold text-white">
                                ৳{settlement.stats?.total_payout?.toLocaleString() || '0'}
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-zinc-900 border border-zinc-800">
                    <TabsTrigger value="resolution" className="data-[state=active]:bg-zinc-800">
                        <Shield className="w-4 h-4 mr-2" /> রেজোলিউশন কিউ
                    </TabsTrigger>
                    <TabsTrigger value="settlement" className="data-[state=active]:bg-zinc-800">
                        <DollarSign className="w-4 h-4 mr-2" /> নিষ্পত্তি
                    </TabsTrigger>
                </TabsList>

                {/* ============================================ */}
                {/* RESOLUTION QUEUE TAB */}
                {/* ============================================ */}
                <TabsContent value="resolution" className="space-y-4">
                    {oracleRequests.length === 0 ? (
                        <Card className="bg-zinc-900/50 border-zinc-800">
                            <CardContent className="p-12 text-center">
                                <Shield className="w-12 h-12 mx-auto text-zinc-600 mb-4" />
                                <h3 className="text-lg font-semibold text-zinc-300">কোনো ওরাকল অনুরোধ নেই</h3>
                                <p className="text-zinc-500 mt-1">মার্কেট বন্ধ হলে রেজোলিউশন প্রস্তাবগুলো এখানে দেখা যাবে।</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="space-y-3">
                            {oracleRequests.map((req) => (
                                <motion.div
                                    key={req.id}
                                    initial={{ opacity: 0, y: 10 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    transition={{ duration: 0.2 }}
                                >
                                    <Card className="bg-zinc-900/50 border-zinc-800 hover:border-zinc-700 transition-colors">
                                        <CardContent className="p-5">
                                            <div className="flex items-start justify-between gap-4">
                                                {/* Left: Info */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <StatusBadge status={req.status} />
                                                        {req.markets?.category && (
                                                            <Badge variant="outline" className="text-xs bg-zinc-800/50 text-zinc-400 border-zinc-700">
                                                                {req.markets.category}
                                                            </Badge>
                                                        )}
                                                    </div>

                                                    <h3 className="text-white font-medium truncate">
                                                        {req.markets?.question || 'Unknown Market'}
                                                    </h3>

                                                    {req.proposed_outcome && (
                                                        <div className="mt-2 flex items-center gap-2">
                                                            <span className="text-xs text-zinc-500">প্রস্তাবিত:</span>
                                                            <Badge className="bg-violet-500/20 text-violet-300 border-violet-500/30">
                                                                {req.proposed_outcome}
                                                            </Badge>
                                                            {req.confidence_score && (
                                                                <span className="text-xs text-zinc-400">
                                                                    ({(req.confidence_score * 100).toFixed(0)}% confidence)
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}

                                                    {req.evidence_text && (
                                                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{req.evidence_text}</p>
                                                    )}

                                                    {/* Challenge Window Countdown */}
                                                    {req.status === 'proposed' && req.challenge_window_ends_at && (
                                                        <div className="mt-2">
                                                            <ChallengeCountdown endsAt={req.challenge_window_ends_at} />
                                                        </div>
                                                    )}
                                                </div>

                                                {/* Right: Actions */}
                                                <div className="flex flex-col gap-2 shrink-0">
                                                    {/* Finalize: Only if proposed & window expired */}
                                                    {req.status === 'proposed' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-emerald-600 text-emerald-400 hover:bg-emerald-500/10"
                                                            onClick={() => handleFinalize(req.id)}
                                                            disabled={processing}
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5 mr-1" /> চূড়ান্ত করুন
                                                        </Button>
                                                    )}

                                                    {/* Challenge */}
                                                    {req.status === 'proposed' && (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-orange-600 text-orange-400 hover:bg-orange-500/10"
                                                            onClick={() => setChallengeDialog({ open: true, requestId: req.id })}
                                                            disabled={processing}
                                                        >
                                                            <Gavel className="w-3.5 h-3.5 mr-1" /> চ্যালেঞ্জ
                                                        </Button>
                                                    )}

                                                    {/* Admin Override */}
                                                    <Button
                                                        size="sm"
                                                        variant="outline"
                                                        className="border-red-600 text-red-400 hover:bg-red-500/10"
                                                        onClick={() => setAdminResolveDialog({
                                                            open: true, requestId: req.id, marketQuestion: req.markets?.question || ''
                                                        })}
                                                        disabled={processing}
                                                    >
                                                        <Shield className="w-3.5 h-3.5 mr-1" /> ওভাররাইড
                                                    </Button>

                                                    {/* Settle: Only if market resolved */}
                                                    {req.status === 'finalized' && (
                                                        <Button
                                                            size="sm"
                                                            className="bg-violet-600 hover:bg-violet-700 text-white"
                                                            onClick={() => setSettleDialog({
                                                                open: true, marketId: req.market_id, marketQuestion: req.markets?.question || ''
                                                            })}
                                                            disabled={processing}
                                                        >
                                                            <DollarSign className="w-3.5 h-3.5 mr-1" /> নিষ্পত্তি
                                                        </Button>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Bond info bar */}
                                            <div className="mt-3 pt-3 border-t border-zinc-800 flex items-center gap-4 text-xs text-zinc-500">
                                                <span>বন্ড: ৳{req.bond_amount}</span>
                                                <span>তৈরি: {new Date(req.created_at).toLocaleDateString('bn-BD')}</span>
                                                {req.finalized_at && <span>চূড়ান্ত: {new Date(req.finalized_at).toLocaleDateString('bn-BD')}</span>}
                                                <span className="font-mono text-zinc-600">{req.id.slice(0, 8)}...</span>
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* ============================================ */}
                {/* SETTLEMENT TAB */}
                {/* ============================================ */}
                <TabsContent value="settlement" className="space-y-4">
                    {/* Settlement Stats */}
                    {settlement.stats && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-4">
                                    <p className="text-sm text-zinc-400">ম্যানুয়াল দাবি</p>
                                    <p className="text-xl font-bold">{settlement.stats.manual_claims || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-4">
                                    <p className="text-sm text-zinc-400">স্বয়ংক্রিয় নিষ্পত্তি</p>
                                    <p className="text-xl font-bold">{settlement.stats.auto_settled_claims || 0}</p>
                                </CardContent>
                            </Card>
                            <Card className="bg-zinc-900/50 border-zinc-800">
                                <CardContent className="p-4">
                                    <p className="text-sm text-zinc-400">মোট রিলেয়ার ফি</p>
                                    <p className="text-xl font-bold">৳{settlement.stats.total_relayer_fees || 0}</p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Settlement Batches */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">নিষ্পত্তি ব্যাচ</CardTitle>
                            <CardDescription>সাম্প্রতিক ব্যাচ নিষ্পত্তি</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {settlement.batches.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500">
                                    <DollarSign className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                                    <p>এখনো কোনো নিষ্পত্তি ব্যাচ নেই</p>
                                </div>
                            ) : (
                                <div className="space-y-2">
                                    {settlement.batches.map((batch: any) => (
                                        <div key={batch.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/30 border border-zinc-800">
                                            <div>
                                                <p className="text-sm font-medium text-white">{batch.markets?.question || batch.market_id}</p>
                                                <p className="text-xs text-zinc-500">{batch.batch_id}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold text-emerald-400">৳{batch.total_amount}</p>
                                                <Badge variant="outline" className={cn(
                                                    'text-xs',
                                                    batch.status === 'completed'
                                                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30'
                                                        : 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                                                )}>
                                                    {batch.status}
                                                </Badge>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Claims List */}
                    <Card className="bg-zinc-900/50 border-zinc-800">
                        <CardHeader>
                            <CardTitle className="text-white">নিষ্পত্তি দাবি</CardTitle>
                            <CardDescription>ব্যক্তিগত ব্যবহারকারীর পেআউট</CardDescription>
                        </CardHeader>
                        <CardContent>
                            {settlement.claims.length === 0 ? (
                                <div className="text-center py-8 text-zinc-500">
                                    <Activity className="w-8 h-8 mx-auto mb-2 text-zinc-600" />
                                    <p>এখনো কোনো দাবি নেই</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead>
                                            <tr className="border-b border-zinc-800 text-zinc-400">
                                                <th className="text-left py-2 px-3">ব্যবহারকারী</th>
                                                <th className="text-left py-2 px-3">মার্কেট</th>
                                                <th className="text-left py-2 px-3">ফলাফল</th>
                                                <th className="text-right py-2 px-3">শেয়ার</th>
                                                <th className="text-right py-2 px-3">পেআউট</th>
                                                <th className="text-center py-2 px-3">স্ট্যাটাস</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {settlement.claims.map((claim: any) => (
                                                <tr key={claim.id} className="border-b border-zinc-800/50 hover:bg-zinc-800/20">
                                                    <td className="py-2 px-3 font-mono text-xs text-zinc-300">{claim.user_id?.slice(0, 8)}...</td>
                                                    <td className="py-2 px-3 text-zinc-300 max-w-[200px] truncate">{claim.markets?.question || claim.market_id}</td>
                                                    <td className="py-2 px-3"><Badge variant="outline" className="text-xs">{claim.outcome}</Badge></td>
                                                    <td className="py-2 px-3 text-right text-zinc-300">{claim.shares}</td>
                                                    <td className="py-2 px-3 text-right font-medium text-emerald-400">৳{claim.payout_amount}</td>
                                                    <td className="py-2 px-3 text-center">
                                                        <Badge variant="outline" className={cn(
                                                            'text-xs',
                                                            claim.status === 'auto_settled' || claim.status === 'claimed'
                                                                ? 'bg-emerald-500/20 text-emerald-400'
                                                                : 'bg-amber-500/20 text-amber-400'
                                                        )}>
                                                            {claim.status}
                                                        </Badge>
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
            </Tabs>

            {/* ============================================ */}
            {/* DIALOGS */}
            {/* ============================================ */}

            {/* Admin Override Dialog */}
            <Dialog open={adminResolveDialog.open} onOpenChange={(open) => setAdminResolveDialog(prev => ({ ...prev, open }))}>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Shield className="w-5 h-5 text-red-400" /> অ্যাডমিন ওভাররাইড — God Mode
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            "{adminResolveDialog.marketQuestion}" সরাসরি আপনার নির্ধারিত ফলাফল দিয়ে সমাধান করুন।
                            এটি ওরাকল প্রক্রিয়া বাইপাস করবে এবং <strong>চূড়ান্ত ও অপরিবর্তনীয়</strong>।
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-zinc-400 mb-1 block">বিজয়ী ফলাফল (Winning Outcome)</label>
                            <Input
                                value={adminOutcome}
                                onChange={(e) => setAdminOutcome(e.target.value)}
                                placeholder="যেমন: হ্যাঁ, দল A, বিটকয়েন"
                                className="bg-zinc-800 border-zinc-700"
                            />
                        </div>
                        <div>
                            <label className="text-sm text-zinc-400 mb-1 block">কারণ (অডিট ট্রেইল)</label>
                            <Textarea
                                value={adminReason}
                                onChange={(e) => setAdminReason(e.target.value)}
                                placeholder="কেন আপনি ওরাকল ওভাররাইড করছেন তা ব্যাখ্যা করুন..."
                                className="bg-zinc-800 border-zinc-700"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setAdminResolveDialog(prev => ({ ...prev, open: false }))}>
                            বাতিল
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleAdminResolve}
                            disabled={!adminOutcome || !adminReason || processing}
                        >
                            {processing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Shield className="w-4 h-4 mr-2" />}
                            ওভাররাইড কার্যকর করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Challenge Dialog */}
            <Dialog open={challengeDialog.open} onOpenChange={(open) => setChallengeDialog(prev => ({ ...prev, open }))}>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <Gavel className="w-5 h-5 text-orange-400" /> চ্যালেঞ্জ প্রস্তাব / Propose Challenge
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            চ্যালেঞ্জ দাখিল করলে একটি বিতর্ক তৈরি হবে এবং প্রস্তাবকারীর বন্ডের সমান বন্ড ম্যাচ হবে।
                            Filing a challenge will create a dispute and match the proposer's bond.
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div>
                            <label className="text-sm text-zinc-400 mb-1 block">চ্যালেঞ্জের কারণ / Reason for Challenge</label>
                            <Textarea
                                value={challengeReason}
                                onChange={(e) => setChallengeReason(e.target.value)}
                                placeholder="কেন আপনি মনে করেন প্রস্তাবিত ফলাফল ভুল তা ব্যাখ্যা করুন... / Explain why you believe the proposed outcome is incorrect..."
                                className="bg-zinc-800 border-zinc-700"
                                rows={3}
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setChallengeDialog(prev => ({ ...prev, open: false }))}>
                            বাতিল / Cancel
                        </Button>
                        <Button
                            className="bg-orange-600 hover:bg-orange-700"
                            onClick={handleChallenge}
                            disabled={!challengeReason || processing}
                        >
                            {processing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <Gavel className="w-4 h-4 mr-2" />}
                            চ্যালেঞ্জ দাখিল
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Settle Dialog */}
            <Dialog open={settleDialog.open} onOpenChange={(open) => setSettleDialog(prev => ({ ...prev, open }))}>
                <DialogContent className="bg-zinc-900 border-zinc-800">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <DollarSign className="w-5 h-5 text-violet-400" /> নিষ্পত্তি কার্যকর করুন / Execute Settlement
                        </DialogTitle>
                        <DialogDescription className="text-zinc-400">
                            এটি "{settleDialog.marketQuestion}"-এর সমস্ত পেআউট প্রক্রিয়া করবে।
                            বিজয়ীরা প্রতি শেয়ারে ৳১.০০ পাবেন (২% ফি বাদে)। এই পদক্ষেপ <strong>চূড়ান্ত</strong>।
                            This will process all payouts for "{settleDialog.marketQuestion}".
                            Winners will receive ৳1.00 per share (minus 2% fee). This action is <strong>final</strong>.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setSettleDialog(prev => ({ ...prev, open: false }))}>
                            বাতিল / Cancel
                        </Button>
                        <Button
                            className="bg-violet-600 hover:bg-violet-700"
                            onClick={handleSettle}
                            disabled={processing}
                        >
                            {processing ? <RefreshCw className="w-4 h-4 animate-spin mr-2" /> : <DollarSign className="w-4 h-4 mr-2" />}
                            নিষ্পত্তি কার্যকর করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
