'use client';

import { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    ShieldCheck,
    ShieldAlert,
    ShieldX,
    Clock,
    Search,
    CheckCircle2,
    XCircle,
    Eye,
    UserCheck,
    UserX,
    ShieldOff,
    Shield,
    Settings,
    Loader2,
    FileText,
    Camera,
    MapPin,
    RefreshCw,
    Sparkles,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/use-toast';

// Status configs with bilingual labels
const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
    unverified: { label: 'অযাচাইকৃত / Unverified', color: 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300', icon: ShieldAlert },
    pending: { label: 'অপেক্ষমান / Pending', color: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400', icon: Clock },
    verified: { label: 'যাচাইকৃত / Verified', color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400', icon: ShieldCheck },
    rejected: { label: 'প্রত্যাখ্যাত / Rejected', color: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400', icon: ShieldX },
};

interface KycUser {
    id: string;
    verification_status: string;
    verification_tier: string;
    full_name: string | null;
    id_type: string | null;
    id_number: string | null;
    phone_number: string | null;
    submitted_at: string | null;
    verified_at: string | null;
    rejection_reason: string | null;
    id_document_front_url: string | null;
    id_document_back_url: string | null;
    selfie_url: string | null;
    proof_of_address_url: string | null;
    risk_score: number;
    daily_withdrawal_limit: number;
    created_at: string;
}

export default function AdminKycPage() {
    const { toast } = useToast();
    const [loading, setLoading] = useState(true);
    const [kycList, setKycList] = useState<KycUser[]>([]);
    const [total, setTotal] = useState(0);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState<string>('pending');
    const [selectedUser, setSelectedUser] = useState<KycUser | null>(null);
    const [actionDialog, setActionDialog] = useState<{ open: boolean; action: string; userId: string }>({
        open: false, action: '', userId: '',
    });
    const [actionReason, setActionReason] = useState('');
    const [rejectionReason, setRejectionReason] = useState('');
    const [actionLoading, setActionLoading] = useState(false);
    const [aiVerificationLoading, setAiVerificationLoading] = useState(false);

    // Settings state
    const [settingsTab, setSettingsTab] = useState(false);
    const [settings, setSettings] = useState({
        withdrawal_threshold: 5000,
        kyc_globally_required: false,
        auto_approve_enabled: false,
    });
    const [settingsLoading, setSettingsLoading] = useState(false);

    const fetchKycList = useCallback(async () => {
        setLoading(true);
        try {
            const params = new URLSearchParams();
            if (statusFilter && statusFilter !== 'all') params.set('status', statusFilter);
            if (searchQuery) params.set('search', searchQuery);
            params.set('limit', '50');

            const res = await fetch(`/api/admin/kyc?${params.toString()}`);
            if (!res.ok) throw new Error('Failed to fetch');
            const data = await res.json();
            setKycList(data.data || []);
            setTotal(data.total || 0);
        } catch (err) {
            console.error('Error fetching KYC list:', err);
        } finally {
            setLoading(false);
        }
    }, [statusFilter, searchQuery]);

    const fetchSettings = async () => {
        try {
            const res = await fetch('/api/admin/kyc/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    withdrawal_threshold: data.withdrawal_threshold || 5000,
                    kyc_globally_required: data.kyc_globally_required || false,
                    auto_approve_enabled: data.auto_approve_enabled || false,
                });
            }
        } catch (err) {
            console.error('Error fetching settings:', err);
        }
    };

    useEffect(() => {
        fetchKycList();
        fetchSettings();
    }, [fetchKycList]);

    const handleAction = async () => {
        if (!actionDialog.userId || !actionDialog.action) return;
        if (actionDialog.action === 'reject' && !rejectionReason.trim()) {
            toast({ variant: 'destructive', title: 'প্রত্যাখ্যানের কারণ দিন / Provide rejection reason' });
            return;
        }

        setActionLoading(true);
        try {
            const res = await fetch(`/api/admin/kyc/${actionDialog.userId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    action: actionDialog.action,
                    reason: actionReason || undefined,
                    rejection_reason: rejectionReason || undefined,
                }),
            });

            if (!res.ok) {
                const err = await res.json();
                throw new Error(err.error);
            }

            const actionLabels: Record<string, string> = {
                approve: 'অনুমোদিত / Approved',
                reject: 'প্রত্যাখ্যাত / Rejected',
                force_kyc: 'KYC বাধ্যতামূলক / KYC Forced',
                waive_kyc: 'KYC মওকুফ / KYC Waived',
                revoke_override: 'ওভাররাইড প্রত্যাহার / Override Revoked',
            };

            toast({ title: `✓ ${actionLabels[actionDialog.action] || 'সফল / Success'}` });
            setActionDialog({ open: false, action: '', userId: '' });
            setActionReason('');
            setRejectionReason('');
            setSelectedUser(null);
            fetchKycList();
        } catch (err: any) {
            toast({ variant: 'destructive', title: err.message || 'ব্যর্থ / Failed' });
        } finally {
            setActionLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        setSettingsLoading(true);
        try {
            const res = await fetch('/api/admin/kyc/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            });

            if (!res.ok) throw new Error('Failed to save');
            toast({ title: 'সেটিংস সংরক্ষিত / Settings saved ✓' });
        } catch (err: any) {
            toast({ variant: 'destructive', title: err.message || 'সংরক্ষণ ব্যর্থ / Save failed' });
        } finally {
            setSettingsLoading(false);
        }
    };

    const handleAiVerify = async () => {
        if (!selectedUser) return;
        setAiVerificationLoading(true);
        try {
            const res = await fetch('/api/admin/kyc/verify', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ userId: selectedUser.id }),
            });

            const data = await res.json();
            if (!res.ok) throw new Error(data.error || 'Verification failed');

            toast({
                title: 'AI যাচাইকরণ সম্পন্ন / AI Verification Complete',
                description: `Status: ${data.ai_result?.status === 'success' ? 'MATCHED' : 'MISMATCH'}. Confidence: ${data.ai_result?.face_verification?.confidence?.toFixed(1)}%`
            });

            // Refresh list to see updated notes
            fetchKycList();
        } catch (err: any) {
            toast({ variant: 'destructive', title: 'AI Error', description: err.message });
        } finally {
            setAiVerificationLoading(false);
        }
    };

    // Stats
    const pendingCount = kycList.filter(u => u.verification_status === 'pending').length;
    const verifiedCount = kycList.filter(u => u.verification_status === 'verified').length;
    const rejectedCount = kycList.filter(u => u.verification_status === 'rejected').length;

    const getIdTypeLabel = (type: string | null) => {
        if (!type) return '—';
        const labels: Record<string, string> = {
            national_id: 'জাতীয় পরিচয়পত্র / NID',
            passport: 'পাসপোর্ট / Passport',
            driving_license: 'ড্রাইভিং লাইসেন্স / DL',
        };
        return labels[type] || type;
    };

    return (
        <div className="space-y-6 p-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                        <ShieldCheck className="h-7 w-7 text-emerald-400" />
                        KYC যাচাইকরণ ব্যবস্থাপনা / KYC Verification Management
                    </h1>
                    <p className="text-slate-400 mt-1">
                        ব্যবহারকারীদের পরিচয় যাচাই এবং ব্যবস্থাপনা / Manage user identity verification
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSettingsTab(!settingsTab)}
                        className="gap-2"
                    >
                        <Settings className="h-4 w-4" />
                        সেটিংস / Settings
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchKycList()}
                        className="gap-2"
                    >
                        <RefreshCw className="h-4 w-4" />
                    </Button>
                </div>
            </div>

            {/* Settings Panel */}
            {settingsTab && (
                <Card className="bg-slate-900 border-slate-700">
                    <CardHeader>
                        <CardTitle className="text-white text-lg">
                            প্ল্যাটফর্ম KYC সেটিংস / Platform KYC Settings
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-2">
                                <Label className="text-slate-300">
                                    উত্তোলন সীমা (৳) / Withdrawal Threshold (৳)
                                </Label>
                                <Input
                                    type="number"
                                    value={settings.withdrawal_threshold}
                                    onChange={e => setSettings(s => ({ ...s, withdrawal_threshold: parseFloat(e.target.value) || 0 }))}
                                    className="bg-slate-800 border-slate-600 text-white"
                                />
                                <p className="text-xs text-slate-500">
                                    এই পরিমাণের পর KYC প্রয়োজন / KYC required after this amount
                                </p>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">
                                    সার্বজনীন KYC / Global KYC Requirement
                                </Label>
                                <div className="flex items-center gap-3 mt-2">
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, kyc_globally_required: !s.kyc_globally_required }))}
                                        className={cn(
                                            'w-12 h-6 rounded-full transition-colors relative',
                                            settings.kyc_globally_required ? 'bg-emerald-500' : 'bg-slate-600'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                                            settings.kyc_globally_required ? 'translate-x-6' : 'translate-x-0.5'
                                        )} />
                                    </button>
                                    <span className="text-sm text-slate-400">
                                        {settings.kyc_globally_required ? 'চালু / ON' : 'বন্ধ / OFF'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label className="text-slate-300">
                                    স্বয়ংক্রিয় অনুমোদন / Auto-Approve
                                </Label>
                                <div className="flex items-center gap-3 mt-2">
                                    <button
                                        onClick={() => setSettings(s => ({ ...s, auto_approve_enabled: !s.auto_approve_enabled }))}
                                        className={cn(
                                            'w-12 h-6 rounded-full transition-colors relative',
                                            settings.auto_approve_enabled ? 'bg-emerald-500' : 'bg-slate-600'
                                        )}
                                    >
                                        <div className={cn(
                                            'w-5 h-5 rounded-full bg-white absolute top-0.5 transition-transform',
                                            settings.auto_approve_enabled ? 'translate-x-6' : 'translate-x-0.5'
                                        )} />
                                    </button>
                                    <span className="text-sm text-slate-400">
                                        {settings.auto_approve_enabled ? 'চালু / ON' : 'বন্ধ / OFF'}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleSaveSettings}
                            disabled={settingsLoading}
                            className="gap-2 bg-emerald-600 hover:bg-emerald-700"
                        >
                            {settingsLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            সংরক্ষণ করুন / Save Settings
                        </Button>
                    </CardContent>
                </Card>
            )}

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-slate-800 flex items-center justify-center">
                            <FileText className="h-5 w-5 text-slate-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-white">{total}</div>
                            <div className="text-xs text-slate-400">মোট / Total</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-amber-800/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-amber-900/30 flex items-center justify-center">
                            <Clock className="h-5 w-5 text-amber-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-amber-400">{pendingCount}</div>
                            <div className="text-xs text-slate-400">অপেক্ষমান / Pending</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-green-800/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-green-900/30 flex items-center justify-center">
                            <CheckCircle2 className="h-5 w-5 text-green-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-green-400">{verifiedCount}</div>
                            <div className="text-xs text-slate-400">যাচাইকৃত / Verified</div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-red-800/50">
                    <CardContent className="p-4 flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-red-900/30 flex items-center justify-center">
                            <XCircle className="h-5 w-5 text-red-400" />
                        </div>
                        <div>
                            <div className="text-2xl font-bold text-red-400">{rejectedCount}</div>
                            <div className="text-xs text-slate-400">প্রত্যাখ্যাত / Rejected</div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Search & Filter */}
            <div className="flex gap-4 items-center">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="নাম, NID নম্বর, বা ফোন দিয়ে খুঁজুন / Search by name, ID, or phone..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="pl-10 bg-slate-900 border-slate-700 text-white"
                    />
                </div>
                <Tabs value={statusFilter} onValueChange={setStatusFilter}>
                    <TabsList className="bg-slate-800">
                        <TabsTrigger value="pending">অপেক্ষমান / Pending</TabsTrigger>
                        <TabsTrigger value="verified">যাচাইকৃত / Verified</TabsTrigger>
                        <TabsTrigger value="rejected">প্রত্যাখ্যাত / Rejected</TabsTrigger>
                        <TabsTrigger value="all">সব / All</TabsTrigger>
                    </TabsList>
                </Tabs>
            </div>

            {/* KYC List */}
            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                </div>
            ) : kycList.length === 0 ? (
                <Card className="bg-slate-900 border-slate-700">
                    <CardContent className="p-12 text-center">
                        <ShieldCheck className="h-12 w-12 mx-auto text-slate-600 mb-4" />
                        <p className="text-slate-400">কোনো KYC আবেদন পাওয়া যায়নি / No KYC submissions found</p>
                    </CardContent>
                </Card>
            ) : (
                <div className="space-y-2">
                    {kycList.map(user => {
                        const statusCfg = STATUS_CONFIG[user.verification_status] || STATUS_CONFIG.unverified;
                        const StatusIcon = statusCfg.icon;
                        return (
                            <Card key={user.id} className="bg-slate-900 border-slate-700 hover:border-slate-600 transition-colors">
                                <CardContent className="p-4">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            <div className="h-10 w-10 rounded-full bg-slate-800 flex items-center justify-center">
                                                <StatusIcon className="h-5 w-5" />
                                            </div>
                                            <div>
                                                <div className="font-medium text-white flex items-center gap-2">
                                                    {user.full_name || 'N/A'}
                                                    <Badge className={cn('text-[10px]', statusCfg.color)}>
                                                        {statusCfg.label.split(' / ')[0]}
                                                    </Badge>
                                                </div>
                                                <div className="text-sm text-slate-400 flex items-center gap-3 mt-0.5">
                                                    <span>{getIdTypeLabel(user.id_type)}: {user.id_number || '—'}</span>
                                                    <span>•</span>
                                                    <span>{user.phone_number || '—'}</span>
                                                    {user.submitted_at && (
                                                        <>
                                                            <span>•</span>
                                                            <span>জমা / Submitted: {new Date(user.submitted_at).toLocaleDateString('bn-BD')}</span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            <Button
                                                size="sm"
                                                variant="ghost"
                                                onClick={() => setSelectedUser(user)}
                                                className="text-slate-400 hover:text-white gap-1"
                                            >
                                                <Eye className="h-4 w-4" />
                                                বিস্তারিত / Details
                                            </Button>

                                            {user.verification_status === 'pending' && (
                                                <>
                                                    <Button
                                                        size="sm"
                                                        onClick={() => setActionDialog({ open: true, action: 'approve', userId: user.id })}
                                                        className="bg-green-600 hover:bg-green-700 gap-1"
                                                    >
                                                        <UserCheck className="h-4 w-4" />
                                                        অনুমোদন
                                                    </Button>
                                                    <Button
                                                        size="sm"
                                                        variant="destructive"
                                                        onClick={() => setActionDialog({ open: true, action: 'reject', userId: user.id })}
                                                        className="gap-1"
                                                    >
                                                        <UserX className="h-4 w-4" />
                                                        প্রত্যাখ্যান
                                                    </Button>
                                                </>
                                            )}

                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setActionDialog({ open: true, action: 'force_kyc', userId: user.id })}
                                                className="text-amber-400 border-amber-700 hover:bg-amber-900/30 gap-1"
                                            >
                                                <ShieldAlert className="h-4 w-4" />
                                                বাধ্যতামূলক
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => setActionDialog({ open: true, action: 'waive_kyc', userId: user.id })}
                                                className="text-blue-400 border-blue-700 hover:bg-blue-900/30 gap-1"
                                            >
                                                <ShieldOff className="h-4 w-4" />
                                                মওকুফ
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            )}

            {/* Detail Side Panel */}
            {selectedUser && (
                <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
                    <DialogContent className="max-w-2xl bg-slate-900 border-slate-700 text-white">
                        <DialogHeader>
                            <DialogTitle className="flex items-center gap-2">
                                <ShieldCheck className="h-5 w-5 text-emerald-400" />
                                KYC বিবরণ / KYC Details — {selectedUser.full_name || 'N/A'}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 max-h-[60vh] overflow-y-auto">
                            {/* Status */}
                            <div className="flex items-center gap-2">
                                <span className="text-slate-400">স্ট্যাটাস / Status:</span>
                                <Badge className={cn(STATUS_CONFIG[selectedUser.verification_status]?.color)}>
                                    {STATUS_CONFIG[selectedUser.verification_status]?.label || selectedUser.verification_status}
                                </Badge>
                            </div>

                            {selectedUser.rejection_reason && (
                                <div className="p-3 bg-red-900/20 border border-red-800 rounded-lg">
                                    <p className="text-sm text-red-400">
                                        প্রত্যাখ্যানের কারণ / Rejection reason: {selectedUser.rejection_reason}
                                    </p>
                                </div>
                            )}

                            {/* Personal Info */}
                            <div className="rounded-lg border border-slate-700 p-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">
                                    ব্যক্তিগত তথ্য / Personal Info
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <span className="text-slate-500">নাম / Name:</span>
                                    <span>{selectedUser.full_name || '—'}</span>
                                    <span className="text-slate-500">পরিচয়পত্র / ID Type:</span>
                                    <span>{getIdTypeLabel(selectedUser.id_type)}</span>
                                    <span className="text-slate-500">নম্বর / ID Number:</span>
                                    <span className="font-mono">{selectedUser.id_number || '—'}</span>
                                    <span className="text-slate-500">ফোন / Phone:</span>
                                    <span>{selectedUser.phone_number || '—'}</span>
                                    <span className="text-slate-500">ঝুঁকি স্কোর / Risk Score:</span>
                                    <span>{selectedUser.risk_score}/100</span>
                                    <span className="text-slate-500">উত্তোলন সীমা / Withdrawal Limit:</span>
                                    <span>৳{selectedUser.daily_withdrawal_limit?.toLocaleString() || '—'}</span>
                                </div>
                            </div>

                            {/* Documents */}
                            <div className="rounded-lg border border-slate-700 p-4">
                                <h3 className="text-sm font-semibold text-slate-400 uppercase mb-3">
                                    ডকুমেন্টসমূহ / Documents
                                </h3>
                                <div className="grid grid-cols-2 gap-3">
                                    <div className={cn(
                                        'p-3 rounded border text-center text-sm',
                                        selectedUser.id_document_front_url ? 'border-green-700 bg-green-900/20' : 'border-slate-700 bg-slate-800'
                                    )}>
                                        <FileText className="h-6 w-6 mx-auto mb-1 text-slate-400" />
                                        <p>পরিচয়পত্র (সামনে) / ID Front</p>
                                        <p className="text-xs mt-1">{selectedUser.id_document_front_url ? '✓ জমা দেওয়া হয়েছে' : '✗ জমা হয়নি'}</p>
                                    </div>
                                    <div className={cn(
                                        'p-3 rounded border text-center text-sm',
                                        selectedUser.id_document_back_url ? 'border-green-700 bg-green-900/20' : 'border-slate-700 bg-slate-800'
                                    )}>
                                        <FileText className="h-6 w-6 mx-auto mb-1 text-slate-400" />
                                        <p>পরিচয়পত্র (পেছনে) / ID Back</p>
                                        <p className="text-xs mt-1">{selectedUser.id_document_back_url ? '✓ জমা দেওয়া হয়েছে' : '✗ জমা হয়নি'}</p>
                                    </div>
                                    <div className={cn(
                                        'p-3 rounded border text-center text-sm',
                                        selectedUser.selfie_url ? 'border-green-700 bg-green-900/20' : 'border-slate-700 bg-slate-800'
                                    )}>
                                        <Camera className="h-6 w-6 mx-auto mb-1 text-slate-400" />
                                        <p>সেলফি / Selfie</p>
                                        <p className="text-xs mt-1">{selectedUser.selfie_url ? '✓ জমা দেওয়া হয়েছে' : '✗ জমা হয়নি'}</p>
                                    </div>
                                    <div className={cn(
                                        'p-3 rounded border text-center text-sm',
                                        selectedUser.proof_of_address_url ? 'border-green-700 bg-green-900/20' : 'border-slate-700 bg-slate-800'
                                    )}>
                                        <MapPin className="h-6 w-6 mx-auto mb-1 text-slate-400" />
                                        <p>ঠিকানার প্রমাণ / Address Proof</p>
                                        <p className="text-xs mt-1">{selectedUser.proof_of_address_url ? '✓ জমা দেওয়া হয়েছে' : '✗ জমা হয়নি'}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <DialogFooter className="flex gap-2 justify-end">
                            {selectedUser.verification_status === 'pending' && (
                                <>
                                    <Button
                                        onClick={handleAiVerify}
                                        disabled={aiVerificationLoading}
                                        className="bg-purple-600 hover:bg-purple-700 gap-1 mr-auto"
                                    >
                                        {aiVerificationLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                                        AI যাচাই / AI Verify
                                    </Button>
                                    <Button
                                        onClick={() => {
                                            setSelectedUser(null);
                                            setActionDialog({ open: true, action: 'approve', userId: selectedUser.id });
                                        }}
                                        className="bg-green-600 hover:bg-green-700 gap-1"
                                    >
                                        <UserCheck className="h-4 w-4" />
                                        অনুমোদন / Approve
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        onClick={() => {
                                            setSelectedUser(null);
                                            setActionDialog({ open: true, action: 'reject', userId: selectedUser.id });
                                        }}
                                        className="gap-1"
                                    >
                                        <UserX className="h-4 w-4" />
                                        প্রত্যাখ্যান / Reject
                                    </Button>
                                </>
                            )}
                            <Button variant="outline" onClick={() => setSelectedUser(null)}>
                                বন্ধ করুন / Close
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            )}

            {/* Action Dialog */}
            <Dialog open={actionDialog.open} onOpenChange={open => !open && setActionDialog({ open: false, action: '', userId: '' })}>
                <DialogContent className="bg-slate-900 border-slate-700 text-white">
                    <DialogHeader>
                        <DialogTitle>
                            {actionDialog.action === 'approve' && '✓ KYC অনুমোদন / Approve KYC'}
                            {actionDialog.action === 'reject' && '✗ KYC প্রত্যাখ্যান / Reject KYC'}
                            {actionDialog.action === 'force_kyc' && '⚡ KYC বাধ্যতামূলক / Force KYC'}
                            {actionDialog.action === 'waive_kyc' && '🛡️ KYC মওকুফ / Waive KYC'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {actionDialog.action === 'approve' && 'এই ব্যবহারকারীর KYC যাচাই অনুমোদন করুন / Approve this user\'s KYC verification'}
                            {actionDialog.action === 'reject' && 'প্রত্যাখ্যানের কারণ উল্লেখ করুন / Provide a reason for rejection'}
                            {actionDialog.action === 'force_kyc' && 'এই ব্যবহারকারীকে KYC সম্পন্ন করতে বাধ্য করুন / Force this user to complete KYC'}
                            {actionDialog.action === 'waive_kyc' && 'এই ব্যবহারকারীর KYC প্রয়োজনীয়তা মওকুফ করুন / Waive KYC requirement for this user'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {actionDialog.action === 'reject' && (
                            <div className="space-y-2">
                                <Label className="text-slate-300">প্রত্যাখ্যানের কারণ / Rejection Reason *</Label>
                                <Textarea
                                    value={rejectionReason}
                                    onChange={e => setRejectionReason(e.target.value)}
                                    placeholder="কেন প্রত্যাখ্যান করা হচ্ছে তা উল্লেখ করুন / Explain why the KYC is being rejected"
                                    className="bg-slate-800 border-slate-600 text-white"
                                    rows={3}
                                />
                            </div>
                        )}
                        <div className="space-y-2">
                            <Label className="text-slate-300">
                                {actionDialog.action === 'reject' ? 'অতিরিক্ত নোট / Additional Notes' : 'কারণ / Reason'}
                            </Label>
                            <Textarea
                                value={actionReason}
                                onChange={e => setActionReason(e.target.value)}
                                placeholder="ঐচ্ছিক নোট / Optional notes"
                                className="bg-slate-800 border-slate-600 text-white"
                                rows={2}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setActionDialog({ open: false, action: '', userId: '' })}
                            className="border-slate-600"
                        >
                            বাতিল / Cancel
                        </Button>
                        <Button
                            onClick={handleAction}
                            disabled={actionLoading}
                            className={cn(
                                'gap-2',
                                actionDialog.action === 'approve' && 'bg-green-600 hover:bg-green-700',
                                actionDialog.action === 'reject' && 'bg-red-600 hover:bg-red-700',
                                actionDialog.action === 'force_kyc' && 'bg-amber-600 hover:bg-amber-700',
                                actionDialog.action === 'waive_kyc' && 'bg-blue-600 hover:bg-blue-700',
                            )}
                        >
                            {actionLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                            {actionDialog.action === 'approve' && 'অনুমোদন / Approve'}
                            {actionDialog.action === 'reject' && 'প্রত্যাখ্যান / Reject'}
                            {actionDialog.action === 'force_kyc' && 'বাধ্যতামূলক / Force KYC'}
                            {actionDialog.action === 'waive_kyc' && 'মওকুফ / Waive KYC'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
