'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { createClient } from '@/lib/supabase/client';
import {
    Plus,
    Search,
    Filter,
    TrendingUp,
    Clock,
    CheckCircle,
    XCircle,
    AlertTriangle,
    Loader2,
    RefreshCw,
    Sparkles,
    Eye,
    Trash2,
    BarChart3,
    Shield,
    FileText,
    Zap,
    Timer,
    ArrowRight,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { MarketCreationWizard } from '@/components/admin/MarketCreationWizard';
import { marketCreationService, type MarketDraft, type LegalReviewItem } from '@/lib/market-creation/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

// ============================================
// QUALITY GATE STATUS COMPONENT
// ============================================

function QualityGateTracker({ draft }: { draft: MarketDraft }) {
    const gates = [
        { id: 'template_selection', label: 'টেমপ্লেট', labelEn: 'Template', icon: FileText },
        { id: 'parameter_configuration', label: 'প্যারামিটার', labelEn: 'Parameters', icon: Zap },
        { id: 'liquidity_commitment', label: 'তারল্য', labelEn: 'Liquidity', icon: BarChart3 },
        { id: 'legal_review', label: 'আইনি পর্যালোচনা', labelEn: 'Legal', icon: Shield },
        { id: 'preview_simulation', label: 'প্রিভিউ', labelEn: 'Preview', icon: Eye },
        { id: 'deployment', label: 'ডিপ্লয়', labelEn: 'Deploy', icon: TrendingUp },
    ];

    const currentIndex = gates.findIndex(g => g.id === draft.current_stage);

    return (
        <div className="flex items-center gap-1">
            {gates.map((gate, index) => {
                const completed = draft.stages_completed?.includes(gate.id);
                const current = gate.id === draft.current_stage;
                const Icon = gate.icon;

                return (
                    <div key={gate.id} className="flex items-center">
                        <div
                            className={cn(
                                "w-7 h-7 rounded-full flex items-center justify-center text-xs transition-all",
                                completed
                                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                                    : current
                                        ? "bg-primary/20 text-primary border border-primary/30 animate-pulse"
                                        : "bg-slate-800 text-slate-600 border border-slate-700"
                            )}
                            title={`${gate.label} (${gate.labelEn})`}
                        >
                            {completed ? (
                                <CheckCircle className="w-3.5 h-3.5" />
                            ) : (
                                <Icon className="w-3.5 h-3.5" />
                            )}
                        </div>
                        {index < gates.length - 1 && (
                            <div
                                className={cn(
                                    "w-4 h-0.5 mx-0.5",
                                    index < currentIndex ? "bg-emerald-500/50" : "bg-slate-700"
                                )}
                            />
                        )}
                    </div>
                );
            })}
        </div>
    );
}

// ============================================
// TIMELINE ESCALATION BADGE
// ============================================

function TimelineEscalation({ createdAt, stage }: { createdAt: string; stage: string }) {
    const [elapsed, setElapsed] = useState(0);

    useEffect(() => {
        const update = () => {
            const diff = Date.now() - new Date(createdAt).getTime();
            setElapsed(diff);
        };
        update();
        const interval = setInterval(update, 60000);
        return () => clearInterval(interval);
    }, [createdAt]);

    const thresholds: Record<string, number> = {
        template_selection: 0,
        parameter_configuration: 10 * 60 * 1000, // 10 minutes
        liquidity_commitment: 24 * 60 * 60 * 1000, // 24 hours
        legal_review: 24 * 60 * 60 * 1000, // 24 hours SLA
        preview_simulation: 0,
        deployment: 5 * 60 * 1000, // 5 minutes
    };

    const threshold = thresholds[stage] || 0;
    if (threshold === 0) return null;

    const isOverdue = elapsed > threshold;
    const progress = Math.min((elapsed / threshold) * 100, 100);

    const formatTime = (ms: number) => {
        const hours = Math.floor(ms / 3600000);
        const minutes = Math.floor((ms % 3600000) / 60000);
        if (hours > 0) return `${hours}ঘ ${minutes}মি`;
        return `${minutes}মি`;
    };

    return (
        <div className="flex items-center gap-2">
            <Timer className={cn("w-3.5 h-3.5", isOverdue ? "text-red-400" : "text-amber-400")} />
            <span className={cn("text-xs", isOverdue ? "text-red-400" : "text-amber-400")}>
                {formatTime(elapsed)}
                {isOverdue && " — বিলম্বিত!"}
            </span>
        </div>
    );
}

// ============================================
// DRAFT LIST ITEM
// ============================================

function DraftListItem({
    draft,
    onResume,
    onDelete,
}: {
    draft: MarketDraft;
    onResume: (id: string) => void;
    onDelete: (id: string) => void;
}) {
    const getStatusBadge = (status: string) => {
        const styles: Record<string, string> = {
            draft: 'bg-slate-700 text-slate-300',
            in_review: 'bg-blue-500/20 text-blue-400 border border-blue-500/30',
            approved: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30',
            rejected: 'bg-red-500/20 text-red-400 border border-red-500/30',
            deployed: 'bg-purple-500/20 text-purple-400 border border-purple-500/30',
        };
        return styles[status] || 'bg-slate-700 text-slate-300';
    };

    const statusLabels: Record<string, string> = {
        draft: 'খসড়া',
        in_review: 'পর্যালোচনায়',
        approved: 'অনুমোদিত',
        rejected: 'প্রত্যাখ্যাত',
        deployed: 'স্থাপিত',
    };

    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-4 rounded-xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-all"
        >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-white text-sm">
                            {draft.question || 'নতুন মার্কেট (Untitled Market)'}
                        </h3>
                        <Badge className={getStatusBadge(draft.status)}>
                            {statusLabels[draft.status] || draft.status}
                        </Badge>
                        {draft.market_type && (
                            <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                                {draft.market_type}
                            </Badge>
                        )}
                    </div>

                    <QualityGateTracker draft={draft} />

                    <div className="flex items-center gap-4 text-xs text-slate-500">
                        <span>তৈরি: {new Date(draft.created_at).toLocaleDateString('bn-BD')}</span>
                        {draft.current_stage && (
                            <TimelineEscalation createdAt={draft.updated_at} stage={draft.current_stage} />
                        )}
                        {draft.liquidity_amount && (
                            <span className="text-emerald-400">৳{draft.liquidity_amount?.toLocaleString('bn-BD')}</span>
                        )}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    {draft.status === 'draft' || draft.status === 'in_review' ? (
                        <>
                            <Button
                                size="sm"
                                onClick={() => onResume(draft.id)}
                                className="bg-primary hover:bg-primary/90"
                            >
                                <ArrowRight className="w-3.5 h-3.5 mr-1" />
                                চালিয়ে যান
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onDelete(draft.id)}
                                className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                            >
                                <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                        </>
                    ) : draft.status === 'deployed' ? (
                        <Badge className="bg-emerald-500/20 text-emerald-400">
                            <CheckCircle className="w-3.5 h-3.5 mr-1" />
                            সম্পন্ন
                        </Badge>
                    ) : null}
                </div>
            </div>
        </motion.div>
    );
}

// ============================================
// LEGAL REVIEW QUEUE
// ============================================

function LegalReviewQueue({ items }: { items: LegalReviewItem[] }) {
    const getRiskColor = (level: string) => {
        const colors: Record<string, string> = {
            low: 'text-emerald-400 bg-emerald-500/10',
            medium: 'text-amber-400 bg-amber-500/10',
            high: 'text-red-400 bg-red-500/10',
        };
        return colors[level] || 'text-slate-400 bg-slate-800';
    };

    if (items.length === 0) {
        return (
            <div className="text-center py-12 text-slate-500">
                <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
                <p>কোনো আইনি পর্যালোচনা মুলতুবি নেই</p>
                <p className="text-xs mt-1">No pending legal reviews</p>
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {items.map((item) => (
                <div
                    key={item.draft_id}
                    className="p-4 rounded-xl bg-slate-900/50 border border-slate-800"
                >
                    <div className="flex items-start justify-between gap-4">
                        <div className="flex-1">
                            <h4 className="font-medium text-white text-sm">{item.question}</h4>
                            <div className="flex items-center gap-2 mt-2 flex-wrap">
                                <Badge className={getRiskColor(item.risk_level)}>
                                    ঝুঁকি: {item.risk_level === 'low' ? 'কম' : item.risk_level === 'medium' ? 'মাঝারি' : 'উচ্চ'}
                                </Badge>
                                <Badge variant="outline" className="text-xs border-slate-700 text-slate-400">
                                    {item.category}
                                </Badge>
                                {item.requires_senior_counsel && (
                                    <Badge className="bg-purple-500/20 text-purple-400 border border-purple-500/30">
                                        <AlertTriangle className="w-3 h-3 mr-1" />
                                        সিনিয়র কাউন্সেল প্রয়োজন
                                    </Badge>
                                )}
                            </div>
                            {item.sensitive_topics && item.sensitive_topics.length > 0 && (
                                <div className="flex gap-1 mt-2 flex-wrap">
                                    {item.sensitive_topics.map((topic, i) => (
                                        <span key={i} className="text-xs px-2 py-0.5 rounded bg-red-500/10 text-red-400">
                                            {topic}
                                        </span>
                                    ))}
                                </div>
                            )}
                        </div>
                        <div className="text-xs text-slate-500">
                            জমা: {new Date(item.submitted_at).toLocaleDateString('bn-BD')}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );
}

// ============================================
// MAIN MARKET MANAGEMENT PAGE
// ============================================

export default function MarketManagementPage() {
    const { t } = useTranslation();
    const [showWizard, setShowWizard] = useState(false);
    const [resumeDraftId, setResumeDraftId] = useState<string | undefined>();
    const [drafts, setDrafts] = useState<MarketDraft[]>([]);
    const [legalQueue, setLegalQueue] = useState<LegalReviewItem[]>([]);
    const [activeTab, setActiveTab] = useState('drafts');
    const [statusFilter, setStatusFilter] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({
        totalDrafts: 0,
        pendingReview: 0,
        deployed: 0,
        rejected: 0,
    });

    const supabase = createClient();

    const loadData = useCallback(async () => {
        setLoading(true);
        try {
            const [draftsData, legalData] = await Promise.all([
                marketCreationService.getDrafts(statusFilter === 'all' ? undefined : statusFilter),
                marketCreationService.getLegalReviewQueue(),
            ]);

            setDrafts(draftsData);
            setLegalQueue(legalData);

            setStats({
                totalDrafts: draftsData.length,
                pendingReview: draftsData.filter(d => d.status === 'in_review').length,
                deployed: draftsData.filter(d => d.status === 'deployed').length,
                rejected: draftsData.filter(d => d.status === 'rejected').length,
            });
        } catch (error) {
            console.error('Error loading data:', error);
        } finally {
            setLoading(false);
        }
    }, [statusFilter]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleResume = (draftId: string) => {
        setResumeDraftId(draftId);
        setShowWizard(true);
    };

    const handleDelete = async (draftId: string) => {
        if (!confirm('এই খসড়া মুছে ফেলতে চান? এই কাজ পূর্বাবস্থায় ফেরানো যাবে না।')) return;
        try {
            await marketCreationService.deleteDraft(draftId);
            loadData();
        } catch (error) {
            console.error('Error deleting draft:', error);
        }
    };

    const handleWizardComplete = () => {
        setShowWizard(false);
        setResumeDraftId(undefined);
        loadData();
    };

    const filteredDrafts = drafts.filter(d => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return (
                d.question?.toLowerCase().includes(query) ||
                d.market_type?.toLowerCase().includes(query) ||
                d.id.toLowerCase().includes(query)
            );
        }
        return true;
    });

    if (showWizard) {
        return (
            <div className="space-y-4">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                        setShowWizard(false);
                        setResumeDraftId(undefined);
                    }}
                    className="text-slate-400 hover:text-white"
                >
                    ← মার্কেট তালিকায় ফিরুন
                </Button>
                <MarketCreationWizard
                    draftId={resumeDraftId}
                    onComplete={handleWizardComplete}
                    onCancel={() => {
                        setShowWizard(false);
                        setResumeDraftId(undefined);
                    }}
                />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white">মার্কেট ব্যবস্থাপনা</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        Market Creation & Quality Gate Management
                    </p>
                </div>
                <Button onClick={() => setShowWizard(true)} className="gap-2">
                    <Sparkles className="w-4 h-4" />
                    নতুন মার্কেট তৈরি করুন
                </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {[
                    {
                        label: 'মোট খসড়া',
                        labelEn: 'Total Drafts',
                        value: stats.totalDrafts,
                        icon: FileText,
                        color: 'text-blue-400',
                        bg: 'bg-blue-500/10',
                    },
                    {
                        label: 'পর্যালোচনা মুলতুবি',
                        labelEn: 'Pending Review',
                        value: stats.pendingReview,
                        icon: Clock,
                        color: 'text-amber-400',
                        bg: 'bg-amber-500/10',
                    },
                    {
                        label: 'স্থাপিত',
                        labelEn: 'Deployed',
                        value: stats.deployed,
                        icon: CheckCircle,
                        color: 'text-emerald-400',
                        bg: 'bg-emerald-500/10',
                    },
                    {
                        label: 'প্রত্যাখ্যাত',
                        labelEn: 'Rejected',
                        value: stats.rejected,
                        icon: XCircle,
                        color: 'text-red-400',
                        bg: 'bg-red-500/10',
                    },
                ].map((stat, index) => (
                    <motion.div
                        key={stat.labelEn}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                    >
                        <Card className="bg-slate-900/80 border-slate-700/50">
                            <CardContent className="p-5">
                                <div className="flex items-start justify-between">
                                    <div>
                                        <p className="text-xs text-slate-400 font-medium">{stat.label}</p>
                                        <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{stat.labelEn}</p>
                                    </div>
                                    <div className={cn("p-2 rounded-lg", stat.bg)}>
                                        <stat.icon className={cn("w-5 h-5", stat.color)} />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </motion.div>
                ))}
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="bg-slate-900 border border-slate-800">
                    <TabsTrigger value="drafts" className="data-[state=active]:bg-slate-800">
                        <FileText className="w-4 h-4 mr-2" />
                        খসড়া ও মার্কেট
                    </TabsTrigger>
                    <TabsTrigger value="legal" className="data-[state=active]:bg-slate-800">
                        <Shield className="w-4 h-4 mr-2" />
                        আইনি পর্যালোচনা
                        {legalQueue.length > 0 && (
                            <Badge variant="destructive" className="ml-2 text-xs">
                                {legalQueue.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="drafts" className="space-y-4">
                    {/* Filters */}
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                            <Input
                                placeholder="মার্কেট খুঁজুন... (Search markets)"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10 bg-slate-900 border-slate-800 text-white"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[200px] bg-slate-900 border-slate-800 text-white">
                                <Filter className="h-4 w-4 mr-2" />
                                <SelectValue placeholder="স্ট্যাটাস ফিল্টার" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">সকল স্ট্যাটাস</SelectItem>
                                <SelectItem value="draft">খসড়া</SelectItem>
                                <SelectItem value="in_review">পর্যালোচনায়</SelectItem>
                                <SelectItem value="approved">অনুমোদিত</SelectItem>
                                <SelectItem value="rejected">প্রত্যাখ্যাত</SelectItem>
                                <SelectItem value="deployed">স্থাপিত</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={loadData} disabled={loading} className="border-slate-700 text-slate-300 hover:text-white">
                            <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
                        </Button>
                    </div>

                    {/* Drafts List */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="w-8 h-8 animate-spin text-primary" />
                        </div>
                    ) : filteredDrafts.length === 0 ? (
                        <div className="text-center py-16 text-slate-500">
                            <FileText className="w-16 h-16 mx-auto mb-4 opacity-20" />
                            <p className="text-lg">কোনো মার্কেট খসড়া পাওয়া যায়নি</p>
                            <p className="text-sm mt-1">No market drafts found</p>
                            <Button onClick={() => setShowWizard(true)} className="mt-4 gap-2">
                                <Plus className="w-4 h-4" />
                                প্রথম মার্কেট তৈরি করুন
                            </Button>
                        </div>
                    ) : (
                        <AnimatePresence>
                            <div className="space-y-3">
                                {filteredDrafts.map((draft) => (
                                    <DraftListItem
                                        key={draft.id}
                                        draft={draft}
                                        onResume={handleResume}
                                        onDelete={handleDelete}
                                    />
                                ))}
                            </div>
                        </AnimatePresence>
                    )}
                </TabsContent>

                <TabsContent value="legal">
                    <LegalReviewQueue items={legalQueue} />
                </TabsContent>
            </Tabs>
        </div>
    );
}
