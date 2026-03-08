'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    Search,
    Filter,
    Users,
    Shield,
    AlertCircle,
    CheckCircle,
    XCircle,
    Clock,
    MoreHorizontal,
    ChevronLeft,
    ChevronRight,
    Loader2,
    RefreshCw,
    FileText,
    TrendingUp,
    AlertTriangle,
    UserCheck,
    UserX,
    Activity,
    Eye,
    Ban,
    Zap,
    Wallet,
    Plus,
    Minus,
    Check,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userManagementService, type UserSearchResult } from '@/lib/user-management/service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';
import { UsdtUsersTab } from './UsdtUsersTab';

const STATUS_FILTERS = [
    { value: 'all', label: 'সকল স্ট্যাটাস', labelEn: 'All Statuses' },
    { value: 'active', label: 'সক্রিয়', labelEn: 'Active' },
    { value: 'suspended', label: 'স্থগিত', labelEn: 'Suspended' },
    { value: 'banned', label: 'নিষিদ্ধ', labelEn: 'Banned' },
    { value: 'dormant', label: 'নিষ্ক্রিয়', labelEn: 'Dormant' },
];

const KYC_FILTERS = [
    { value: 'all', label: 'সকল KYC', labelEn: 'All KYC' },
    { value: 'verified', label: 'যাচাইকৃত', labelEn: 'Verified' },
    { value: 'pending', label: 'মুলতুবি', labelEn: 'Pending' },
    { value: 'unverified', label: 'অযাচাইকৃত', labelEn: 'Unverified' },
    { value: 'rejected', label: 'প্রত্যাখ্যাত', labelEn: 'Rejected' },
];

// ============================================
// RISK SCORE INDICATOR
// ============================================

function RiskScoreIndicator({ score }: { score?: number }) {
    const riskScore = score || 0;
    const getRiskConfig = (s: number) => {
        if (s >= 80) return { label: 'Critical', labelBn: 'সঙ্কটজনক', color: 'text-red-400', bg: 'bg-red-500', barColor: 'bg-red-500' };
        if (s >= 60) return { label: 'High', labelBn: 'উচ্চ', color: 'text-orange-400', bg: 'bg-orange-500', barColor: 'bg-orange-500' };
        if (s >= 40) return { label: 'Medium', labelBn: 'মাঝারি', color: 'text-amber-400', bg: 'bg-amber-500', barColor: 'bg-amber-500' };
        return { label: 'Low', labelBn: 'নিম্ন', color: 'text-emerald-400', bg: 'bg-emerald-500', barColor: 'bg-emerald-500' };
    };

    const config = getRiskConfig(riskScore);

    return (
        <div className="flex items-center gap-2">
            <div className="w-16 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div
                    className={cn("h-full rounded-full transition-all", config.barColor)}
                    style={{ width: `${riskScore}%` }}
                />
            </div>
            <span className={cn("text-xs font-medium", config.color)}>{riskScore}</span>
        </div>
    );
}

// ============================================
// USER ROW COMPONENT
// ============================================

function UserRow({ user, onViewProfile, onQuickAction, selectedUsers, onToggleSelect }: {
    user: UserSearchResult;
    onViewProfile: (id: string) => void;
    onQuickAction: (userId: string, action: string) => void;
    selectedUsers: string[];
    onToggleSelect: (userId: string) => void;
}) {
    const getStatusBadge = (status: string) => {
        const styles: Record<string, { class: string; icon: typeof CheckCircle; label: string }> = {
            active: { class: 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30', icon: CheckCircle, label: 'সক্রিয়' },
            suspended: { class: 'bg-red-500/20 text-red-400 border border-red-500/30', icon: UserX, label: 'স্থগিত' },
            banned: { class: 'bg-red-700/20 text-red-500 border border-red-700/30', icon: Ban, label: 'নিষিদ্ধ' },
            dormant: { class: 'bg-slate-700/50 text-slate-400 border border-slate-600', icon: Clock, label: 'নিষ্ক্রিয়' },
        };
        return styles[status] || styles.dormant;
    };

    const getKycBadge = (status: string) => {
        const styles: Record<string, { class: string; label: string }> = {
            verified: { class: 'bg-emerald-500/20 text-emerald-400', label: 'যাচাইকৃত' },
            pending: { class: 'bg-blue-500/20 text-blue-400', label: 'মুলতুবি' },
            unverified: { class: 'bg-amber-500/20 text-amber-400', label: 'অযাচাইকৃত' },
            rejected: { class: 'bg-red-500/20 text-red-400', label: 'প্রত্যাখ্যাত' },
        };
        return styles[status] || styles.unverified;
    };

    const getTierBadge = (tier: string) => {
        const styles: Record<string, string> = {
            basic: 'text-slate-400',
            standard: 'text-blue-400',
            premium: 'text-purple-400',
            institutional: 'text-amber-400',
        };
        return styles[tier] || 'text-slate-400';
    };

    const statusConfig = getStatusBadge(user.account_status);
    const kycConfig = getKycBadge(user.kyc_status);
    const StatusIcon = statusConfig.icon;

    return (
        <motion.tr
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="border-b border-slate-800 hover:bg-slate-800/30 cursor-pointer transition-colors"
            onClick={() => onViewProfile(user.user_id)}
        >
            <td className="py-3 px-4">
                <Checkbox
                    checked={selectedUsers.includes(user.user_id)}
                    onCheckedChange={() => onToggleSelect(user.user_id)}
                    onClick={(e) => e.stopPropagation()}
                    className="border-slate-600"
                />
            </td>
            <td className="py-3 px-4">
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-sm font-bold text-white">
                        {(user.full_name || user.email || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                        <p className="font-medium text-white text-sm">{user.full_name || 'নাম নেই'}</p>
                        <p className="text-xs text-slate-500">{user.email}</p>
                    </div>
                </div>
            </td>
            <td className="py-3 px-4">
                <Badge className={cn("text-xs flex items-center gap-1 w-fit", statusConfig.class)}>
                    <StatusIcon className="w-3 h-3" />
                    {statusConfig.label}
                </Badge>
            </td>
            <td className="py-3 px-4">
                <Badge className={cn("text-xs", kycConfig.class)}>
                    {kycConfig.label}
                </Badge>
            </td>
            <td className="py-3 px-4">
                <span className={cn("text-xs font-medium capitalize", getTierBadge(user.verification_tier))}>
                    {user.verification_tier === 'basic' ? 'বেসিক' :
                        user.verification_tier === 'standard' ? 'স্ট্যান্ডার্ড' :
                            user.verification_tier === 'premium' ? 'প্রিমিয়াম' :
                                user.verification_tier === 'institutional' ? 'প্রাতিষ্ঠানিক' :
                                    user.verification_tier}
                </span>
            </td>
            <td className="py-3 px-4">
                <RiskScoreIndicator score={(user as any).risk_score} />
            </td>
            <td className="py-3 px-4">
                <span className="text-xs text-slate-500">
                    {new Date(user.created_at).toLocaleDateString('bn-BD')}
                </span>
            </td>
            <td className="py-3 px-4 text-right">
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" onClick={(e) => e.stopPropagation()} className="text-slate-400 hover:text-white">
                            <MoreHorizontal className="h-4 w-4" />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="bg-slate-900 border-slate-800">
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile(user.user_id);
                        }} className="text-slate-300 hover:text-white">
                            <Eye className="h-4 w-4 mr-2" />
                            প্রোফাইল দেখুন
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile(user.user_id + '?tab=trading');
                        }} className="text-slate-300 hover:text-white">
                            <TrendingUp className="h-4 w-4 mr-2" />
                            ট্রেডিং ইতিহাস
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onViewProfile(user.user_id + '?tab=interventions');
                        }} className="text-amber-400 hover:text-amber-300">
                            <AlertTriangle className="h-4 w-4 mr-2" />
                            হস্তক্ষেপ
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            window.open(`/sys-cmd-7x9k2/users/detail?id=${user.user_id}&tab=wallet`, '_blank');
                        }} className="text-emerald-400 hover:text-emerald-300">
                            <Wallet className="h-4 w-4 mr-2" />
                            ওয়ালেট ম্যানেজ
                        </DropdownMenuItem>
                        <DropdownMenuSeparator className="bg-slate-800" />
                        <DropdownMenuItem onClick={(e) => {
                            e.stopPropagation();
                            onQuickAction(user.user_id, user.account_status === 'suspended' ? 'activate' : 'suspend');
                        }} className="text-red-400 hover:text-red-300">
                            {user.account_status === 'suspended' ? (
                                <>
                                    <UserCheck className="h-4 w-4 mr-2" />
                                    অ্যাকাউন্ট সক্রিয় করুন
                                </>
                            ) : (
                                <>
                                    <UserX className="h-4 w-4 mr-2" />
                                    অ্যাকাউন্ট স্থগিত করুন
                                </>
                            )}
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </td>
        </motion.tr>
    );
}

// ============================================
// MAIN USER MANAGEMENT PAGE
// ============================================

export default function UserManagementPage() {
    const { t } = useTranslation();
    const router = useRouter();
    const [users, setUsers] = useState<UserSearchResult[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [kycFilter, setKycFilter] = useState('all');
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [quickActionLoading, setQuickActionLoading] = useState<string | null>(null);
    const limit = 20;

    // Bulk selection state
    const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
    const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
    const [bulkAction, setBulkAction] = useState<'credit' | 'debit'>('credit');
    const [bulkAmount, setBulkAmount] = useState('');
    const [bulkReason, setBulkReason] = useState('');
    const [bulkSubmitting, setBulkSubmitting] = useState(false);

    // Aggregate stats
    const [aggregateStats, setAggregateStats] = useState({
        totalUsers: 0,
        activeUsers: 0,
        pendingKyc: 0,
        suspendedUsers: 0,
        highRiskUsers: 0,
    });

    const loadUsers = useCallback(async () => {
        setLoading(true);
        try {
            const result = await userManagementService.searchUsers({
                query: searchQuery,
                status: statusFilter === 'all' ? undefined : statusFilter,
                kyc: kycFilter === 'all' ? undefined : kycFilter,
                limit,
                offset: page * limit,
            });
            setUsers(result.data);
            setTotal(result.total);

            // Calculate stats from current page (approximation)
            setAggregateStats({
                totalUsers: result.total,
                activeUsers: result.data.filter(u => u.account_status === 'active').length,
                pendingKyc: result.data.filter(u => u.kyc_status === 'pending').length,
                suspendedUsers: result.data.filter(u => u.account_status === 'suspended').length,
                highRiskUsers: result.data.filter(u => (u as any).risk_score >= 70).length,
            });
        } catch (error) {
            console.error('Error loading users:', error);
        } finally {
            setLoading(false);
        }
    }, [searchQuery, statusFilter, kycFilter, page]);

    useEffect(() => {
        loadUsers();
    }, [loadUsers]);

    const handleViewProfile = (userIdWithTab: string) => {
        const [userId, tab] = userIdWithTab.split('?tab=');
        const base = `/sys-cmd-7x9k2/users/detail?id=${userId}`;
        router.push(tab ? `${base}&tab=${tab}` : base);
    };

    const handleQuickAction = async (userId: string, action: string) => {
        const confirmMsg = action === 'suspend'
            ? 'এই ব্যবহারকারীকে স্থগিত করতে চান? (Suspend this user?)'
            : 'এই ব্যবহারকারীকে সক্রিয় করতে চান? (Activate this user?)';

        if (!confirm(confirmMsg)) return;

        setQuickActionLoading(userId);
        try {
            await userManagementService.updateUserStatus(
                userId,
                {
                    account_status: action === 'suspend' ? 'suspended' : 'active',
                    can_trade: action !== 'suspend',
                },
                action === 'suspend' ? 'Admin quick suspension' : 'Admin reactivation',
            );
            loadUsers();
        } catch (error: any) {
            if (error.message?.includes('dual')) {
                alert('দ্বৈত অনুমোদন প্রয়োজন। (Dual authorization required)');
            }
            console.error('Quick action error:', error);
        } finally {
            setQuickActionLoading(null);
        }
    };

    const handleBulkAction = async () => {
        if (!bulkAmount || parseFloat(bulkAmount) <= 0 || selectedUsers.length === 0) return;

        setBulkSubmitting(true);
        try {
            const response = await fetch('/api/admin/users/wallet/bulk', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    action: bulkAction,
                    userIds: selectedUsers,
                    amount: parseFloat(bulkAmount),
                    reason: bulkReason || `Bulk ${bulkAction} by admin`
                })
            });

            const result = await response.json();

            if (result.success) {
                alert(`সফলভাবে ${result.processed} ইউজারের ${bulkAction} করা হয়েছে।`);
                setBulkDialogOpen(false);
                setSelectedUsers([]);
                setBulkAmount('');
                setBulkReason('');
                loadUsers();
            } else {
                alert(`ত্রুটি: ${result.error}`);
            }
        } catch (error: any) {
            alert(`ত্রুটি: ${error.message}`);
        } finally {
            setBulkSubmitting(false);
        }
    };

    const totalPages = Math.ceil(total / limit);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-white">ব্যবহারকারী ব্যবস্থাপনা (User Management)</h1>
                    <p className="text-sm text-slate-400 mt-1">
                        User Lifecycle Management — KYC, Trading, Risk & Interventions
                    </p>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={loadUsers} disabled={loading} className="border-slate-800 text-slate-400 w-full md:w-auto">
                        <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
                        রিফ্রেশ
                    </Button>
                </div>
            </div>

            {/* Bulk Action Bar */}
            {selectedUsers.length > 0 && (
                <div className="flex items-center justify-between bg-slate-900 border border-slate-700 rounded-lg p-4">
                    <div className="flex items-center gap-3">
                        <Checkbox
                            checked={true}
                            onCheckedChange={() => setSelectedUsers([])}
                            className="border-slate-600"
                        />
                        <span className="text-white font-medium">
                            {selectedUsers.length} ইউজার নির্বাচিত
                        </span>
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => { setBulkAction('credit'); setBulkDialogOpen(true); }}
                            className="border-emerald-600 text-emerald-400 hover:bg-emerald-600/20"
                        >
                            <Plus className="h-4 w-4 mr-2" />
                            বাল্ক ক্রেডিট
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => { setBulkAction('debit'); setBulkDialogOpen(true); }}
                            className="border-red-600 text-red-400 hover:bg-red-600/20"
                        >
                            <Minus className="h-4 w-4 mr-2" />
                            বাল্ক ডেবিট
                        </Button>
                        <Button
                            variant="ghost"
                            onClick={() => setSelectedUsers([])}
                            className="text-slate-400 hover:text-white"
                        >
                            বাতিল
                        </Button>
                    </div>
                </div>
            )}

            {/* MarketStatsBanner */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-slate-900/50 p-4 rounded-xl border border-slate-800 mb-6">
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-blue-500/10 rounded-lg">
                        <Activity className="w-6 h-6 text-blue-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">মোট ভলিউম (Total Volume)</p>
                        <p className="text-xl font-bold text-white">$245,000</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-500/10 rounded-lg">
                        <Users className="w-6 h-6 text-emerald-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">সক্রিয় ব্যবহারকারী (Active Users)</p>
                        <p className="text-xl font-bold text-white">{aggregateStats.activeUsers.toLocaleString('bn-BD')}</p>
                    </div>
                </div>
                <div className="flex items-center gap-4">
                    <div className="p-3 bg-red-500/10 rounded-lg">
                        <AlertCircle className="w-6 h-6 text-red-400" />
                    </div>
                    <div>
                        <p className="text-sm text-slate-400">ব্যর্থ জব (Failed Jobs)</p>
                        <p className="text-xl font-bold text-white">2 <span className="text-xs text-red-400 ml-2">Review Required</span></p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="general" className="w-full">
                <div className="mb-4">
                    <TabsList className="grid w-full grid-cols-1 md:grid-cols-2 lg:w-[400px] h-auto bg-slate-900 border border-slate-800 gap-1 p-1">
                        <TabsTrigger value="general" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-400">
                            সাধারণ ইউজার (General)
                        </TabsTrigger>
                        <TabsTrigger value="usdt" className="py-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground text-slate-400">
                            USDT ইউজার (Money Op)
                        </TabsTrigger>
                    </TabsList>
                </div>

                <TabsContent value="general" className="space-y-6 mt-0">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                        {[
                            { label: 'মোট ব্যবহারকারী', labelEn: 'Total Users', value: aggregateStats.totalUsers, icon: Users, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                            { label: 'সক্রিয়', labelEn: 'Active', value: aggregateStats.activeUsers, icon: UserCheck, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
                            { label: 'KYC মুলতুবি', labelEn: 'Pending KYC', value: aggregateStats.pendingKyc, icon: Clock, color: 'text-amber-400', bg: 'bg-amber-500/10' },
                            { label: 'স্থগিত', labelEn: 'Suspended', value: aggregateStats.suspendedUsers, icon: UserX, color: 'text-red-400', bg: 'bg-red-500/10' },
                            { label: 'উচ্চ ঝুঁকি', labelEn: 'High Risk', value: aggregateStats.highRiskUsers, icon: AlertTriangle, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                        ].map((stat, index) => (
                            <motion.div
                                key={stat.labelEn}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.08 }}
                            >
                                <Card className="bg-slate-900 border-slate-800">
                                    <CardContent className="p-4">
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="text-[11px] text-slate-500">{stat.label}</p>
                                                <p className="text-xl font-bold text-white mt-0.5">{stat.value}</p>
                                            </div>
                                            <div className={cn("p-2 rounded-lg", stat.bg)}>
                                                <stat.icon className={cn("w-4 h-4", stat.color)} />
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            </motion.div>
                        ))}
                    </div>

                    {/* Filters */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-4">
                            <div className="flex flex-col md:flex-row gap-3">
                                <div className="relative flex-1">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500" />
                                    <Input
                                        placeholder="ইমেইল, নাম, অথবা ইউজার ID দিয়ে খুঁজুন..."
                                        value={searchQuery}
                                        onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
                                        className="pl-10 bg-slate-950 border-slate-800 text-white placeholder:text-slate-600"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v); setPage(0); }}>
                                        <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-white">
                                            <Filter className="h-4 w-4 mr-2" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800">
                                            {STATUS_FILTERS.map(f => (
                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={kycFilter} onValueChange={(v) => { setKycFilter(v); setPage(0); }}>
                                        <SelectTrigger className="w-[180px] bg-slate-950 border-slate-800 text-white">
                                            <Shield className="h-4 w-4 mr-2" />
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="bg-slate-900 border-slate-800">
                                            {KYC_FILTERS.map(f => (
                                                <SelectItem key={f.value} value={f.value}>{f.label}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Users Table */}
                    <Card className="bg-slate-900 border-slate-800">
                        <CardHeader className="pb-2">
                            <CardTitle className="text-sm font-medium text-slate-400">
                                মোট {total.toLocaleString('bn-BD')} জন ব্যবহারকারীর মধ্যে {users.length} জন দেখানো হচ্ছে
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {loading ? (
                                <div className="flex items-center justify-center py-16">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : users.length === 0 ? (
                                <div className="text-center py-16 text-slate-500">
                                    <Users className="h-16 w-16 mx-auto mb-4 opacity-20" />
                                    <p className="text-lg">কোনো ব্যবহারকারী পাওয়া যায়নি</p>
                                    <p className="text-sm mt-1">No users found</p>
                                </div>
                            ) : (
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-slate-800">
                                                <th className="text-left py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider w-10">
                                                    <Checkbox
                                                        checked={selectedUsers.length === users.length && users.length > 0}
                                                        onCheckedChange={(checked) => {
                                                            if (checked) {
                                                                setSelectedUsers(users.map(u => u.user_id));
                                                            } else {
                                                                setSelectedUsers([]);
                                                            }
                                                        }}
                                                        className="border-slate-600"
                                                    />
                                                </th>
                                                <th className="text-left py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider">ব্যবহারকারী</th>
                                                <th className="text-left py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider">স্ট্যাটাস</th>
                                                <th className="text-left py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider">KYC</th>
                                                <th className="text-left py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider">টিয়ার</th>
                                                <th className="text-left py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider">ঝুঁকি</th>
                                                <th className="text-left py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider">যোগদান</th>
                                                <th className="text-right py-3 px-4 font-medium text-xs text-slate-500 uppercase tracking-wider">অ্যাকশন</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {users.map((user) => (
                                                <UserRow
                                                    key={user.user_id}
                                                    user={user}
                                                    onViewProfile={handleViewProfile}
                                                    onQuickAction={handleQuickAction}
                                                    selectedUsers={selectedUsers}
                                                    onToggleSelect={(id) => {
                                                        setSelectedUsers(prev =>
                                                            prev.includes(id)
                                                                ? prev.filter(uid => uid !== id)
                                                                : [...prev, id]
                                                        );
                                                    }}
                                                />
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}

                            {/* Pagination */}
                            {totalPages > 1 && (
                                <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-800">
                                    <p className="text-sm text-slate-500">
                                        পৃষ্ঠা {(page + 1).toLocaleString('bn-BD')} / {totalPages.toLocaleString('bn-BD')}
                                    </p>
                                    <div className="flex gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => Math.max(0, p - 1))}
                                            disabled={page === 0 || loading}
                                            className="border-slate-800 text-slate-400"
                                        >
                                            <ChevronLeft className="h-4 w-4 mr-1" />
                                            আগের
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => setPage(p => p + 1)}
                                            disabled={(page + 1) * limit >= total || loading}
                                            className="border-slate-800 text-slate-400"
                                        >
                                            পরের
                                            <ChevronRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    </div>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="usdt" className="mt-0">
                    <UsdtUsersTab />
                </TabsContent>
            </Tabs>

            {/* Bulk Credit/Debit Dialog */}
            <Dialog open={bulkDialogOpen} onOpenChange={setBulkDialogOpen}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle>
                            {bulkAction === 'credit' ? 'বাল্ক ক্রেডিট (Bulk Credit)' : 'বাল্ক ডেবিট (Bulk Debit)'}
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            {selectedUsers.length} ইউজারের ওয়ালেটে {bulkAction === 'credit' ? 'ক্রেডিট' : 'ডেবিট'} করবেন।
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">পরিমাণ (BDT) *</label>
                            <Input
                                type="number"
                                value={bulkAmount}
                                onChange={(e) => setBulkAmount(e.target.value)}
                                placeholder="0.00"
                                min="0"
                                step="0.01"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm text-slate-400">কারণ (ঐচ্ছিক)</label>
                            <Input
                                value={bulkReason}
                                onChange={(e) => setBulkReason(e.target.value)}
                                placeholder="e.g., বোনাস, রিফান্ড"
                                className="bg-slate-800 border-slate-700 text-white"
                            />
                        </div>
                        <div className={bulkAction === 'credit' ? 'bg-emerald-500/20 p-3 rounded-lg' : 'bg-red-500/20 p-3 rounded-lg'}>
                            <p className={bulkAction === 'credit' ? 'text-sm text-emerald-400' : 'text-sm text-red-400'}>
                                ⚠️ এই অ্যাকশন {selectedUsers.length} ইউজারকে প্রভাবিত করবে।
                                {bulkAction === 'credit' ? ' তহবিল যোগ করা হবে।' : ' তহবিল কাটা হবে।'}
                            </p>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setBulkDialogOpen(false)}
                            className="border-slate-700 text-slate-300"
                        >
                            বাতিল
                        </Button>
                        <Button
                            onClick={handleBulkAction}
                            disabled={!bulkAmount || parseFloat(bulkAmount) <= 0 || bulkSubmitting}
                            className={bulkAction === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'}
                        >
                            {bulkSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    প্রসেসিং...
                                </>
                            ) : (
                                <>
                                    {bulkAction === 'credit' ? 'ক্রেডিট করুন' : 'ডেবিট করুন'}
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
