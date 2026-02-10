'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
    ArrowLeft,
    User,
    Shield,
    TrendingUp,
    Headphones,
    History,
    AlertCircle,
    Loader2,
    AlertTriangle,
    Settings,
    CheckCircle,
    UserX,
    Ban,
    Clock,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { userManagementService } from '@/lib/user-management/service';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils';

// Import view components
import { UserOverviewView } from './components/UserOverviewView';
import { UserStatusPanel } from './components/UserStatusPanel';
import { UserInterventionView } from './components/UserInterventionView';
import { UserSupportPanel } from './components/UserSupportPanel';
import { UserAuditView } from './components/UserAuditView';

function UserDetailContent() {
    const { t } = useTranslation();
    const router = useRouter();
    const searchParams = useSearchParams();
    const userId = searchParams.get('id');
    const initialTab = searchParams.get('tab') || 'overview';

    const [loading, setLoading] = useState(true);
    const [userData, setUserData] = useState<any>(null);
    const [activeTab, setActiveTab] = useState(initialTab);

    useEffect(() => {
        if (userId) {
            loadUserData();
        }
    }, [userId]);

    const loadUserData = async () => {
        setLoading(true);
        try {
            const data = await userManagementService.getUserDetail(userId!);
            setUserData(data);
        } catch (error) {
            console.error('Error loading user:', error);
        } finally {
            setLoading(false);
        }
    };

    const getStatusConfig = (status: string) => {
        const configs: Record<string, { class: string; icon: typeof CheckCircle; label: string }> = {
            active: { class: 'bg-emerald-500', icon: CheckCircle, label: 'সক্রিয়' },
            suspended: { class: 'bg-red-500', icon: UserX, label: 'স্থগিত' },
            banned: { class: 'bg-red-700', icon: Ban, label: 'নিষিদ্ধ' },
            dormant: { class: 'bg-slate-500', icon: Clock, label: 'নিষ্ক্রিয়' },
        };
        return configs[status] || configs.dormant;
    };

    const getRiskLevel = (score: number) => {
        if (score >= 80) return { label: 'সঙ্কটজনক', color: 'text-red-400' };
        if (score >= 60) return { label: 'উচ্চ', color: 'text-orange-400' };
        if (score >= 40) return { label: 'মাঝারি', color: 'text-amber-400' };
        return { label: 'নিম্ন', color: 'text-emerald-400' };
    };

    if (!userId) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-white">ব্যবহারকারী ID প্রদান করা হয়নি</h2>
                <p className="text-slate-400 mb-4">No User ID provided</p>
                <Button onClick={() => router.push('/sys-cmd-7x9k2/users')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    ব্যবহারকারী তালিকায় ফিরুন
                </Button>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!userData) {
        return (
            <div className="text-center py-20">
                <AlertCircle className="h-16 w-16 text-red-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold mb-2 text-white">ব্যবহারকারী পাওয়া যায়নি</h2>
                <p className="text-slate-400 mb-4">User Not Found</p>
                <Button onClick={() => router.push('/sys-cmd-7x9k2/users')} className="gap-2">
                    <ArrowLeft className="h-4 w-4" />
                    ব্যবহারকারী তালিকায় ফিরুন
                </Button>
            </div>
        );
    }

    const { profile } = userData;
    const statusConfig = getStatusConfig(profile.account_status);
    const StatusIcon = statusConfig.icon;
    const riskLevel = getRiskLevel(profile.risk_score || 0);

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    <Button
                        variant="outline"
                        size="icon"
                        onClick={() => router.push('/sys-cmd-7x9k2/users')}
                        className="border-slate-800 text-slate-400 hover:text-white"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary/30 to-purple-500/30 flex items-center justify-center text-xl font-bold text-white border border-slate-700">
                            {(profile.full_name || profile.email || 'U').charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <h1 className="text-2xl font-bold text-white">
                                    {profile.full_name || 'নাম নেই'}
                                </h1>
                                <Badge className={statusConfig.class}>
                                    <StatusIcon className="w-3 h-3 mr-1" />
                                    {statusConfig.label}
                                </Badge>
                            </div>
                            <p className="text-slate-400 text-sm">{profile.email}</p>
                            <p className="text-xs text-slate-600 font-mono mt-0.5">ID: {profile.user_id}</p>
                        </div>
                    </div>
                </div>

                {/* Access logged indicator */}
                <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900 border border-slate-800">
                    <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                    <span className="text-xs text-slate-500">অ্যাক্সেস লগ হচ্ছে</span>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                        <p className="text-[11px] text-slate-500">KYC স্ট্যাটাস</p>
                        <Badge className={cn(
                            "mt-1",
                            profile.kyc_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                                profile.kyc_status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                                    'bg-amber-500/20 text-amber-400'
                        )}>
                            {profile.kyc_status === 'verified' ? 'যাচাইকৃত' :
                                profile.kyc_status === 'pending' ? 'মুলতুবি' : 'অযাচাইকৃত'}
                        </Badge>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                        <p className="text-[11px] text-slate-500">ঝুঁকি স্কোর</p>
                        <div className="flex items-center gap-2 mt-1">
                            <p className={cn("text-xl font-bold", riskLevel.color)}>
                                {profile.risk_score || 0}
                            </p>
                            <span className={cn("text-xs", riskLevel.color)}>{riskLevel.label}</span>
                        </div>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                        <p className="text-[11px] text-slate-500">মোট ট্রেড</p>
                        <p className="text-xl font-bold text-white mt-1">{(profile.total_trades || 0).toLocaleString('bn-BD')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                        <p className="text-[11px] text-slate-500">ওপেন পজিশন</p>
                        <p className="text-xl font-bold text-white mt-1">{(profile.open_positions_count || 0).toLocaleString('bn-BD')}</p>
                    </CardContent>
                </Card>
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-4">
                        <p className="text-[11px] text-slate-500">মোট ভলিউম</p>
                        <p className="text-xl font-bold text-white mt-1">৳{((profile.total_volume || 0) / 1000).toFixed(1)}K</p>
                    </CardContent>
                </Card>
            </div>

            {/* Tabs */}
            <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="grid w-full grid-cols-6 bg-slate-900 border border-slate-800">
                    <TabsTrigger value="overview" className="data-[state=active]:bg-slate-800 text-xs">
                        <User className="h-3.5 w-3.5 mr-1.5" />
                        ওভারভিউ
                    </TabsTrigger>
                    <TabsTrigger value="status" className="data-[state=active]:bg-slate-800 text-xs">
                        <Settings className="h-3.5 w-3.5 mr-1.5" />
                        স্ট্যাটাস
                    </TabsTrigger>
                    <TabsTrigger value="trading" className="data-[state=active]:bg-slate-800 text-xs">
                        <TrendingUp className="h-3.5 w-3.5 mr-1.5" />
                        ট্রেডিং
                    </TabsTrigger>
                    <TabsTrigger value="interventions" className="data-[state=active]:bg-slate-800 text-xs">
                        <AlertTriangle className="h-3.5 w-3.5 mr-1.5" />
                        হস্তক্ষেপ
                    </TabsTrigger>
                    <TabsTrigger value="support" className="data-[state=active]:bg-slate-800 text-xs">
                        <Headphones className="h-3.5 w-3.5 mr-1.5" />
                        সাপোর্ট
                    </TabsTrigger>
                    <TabsTrigger value="audit" className="data-[state=active]:bg-slate-800 text-xs">
                        <History className="h-3.5 w-3.5 mr-1.5" />
                        অডিট
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="overview">
                    <UserOverviewView userId={userId} userData={userData} onUpdate={loadUserData} />
                </TabsContent>

                <TabsContent value="status">
                    <UserStatusPanel userId={userId} userData={userData} onUpdate={loadUserData} />
                </TabsContent>

                <TabsContent value="trading">
                    <UserOverviewView userId={userId} userData={userData} onUpdate={loadUserData} tradingOnly />
                </TabsContent>

                <TabsContent value="interventions">
                    <UserInterventionView userId={userId} profile={profile} onUpdate={loadUserData} />
                </TabsContent>

                <TabsContent value="support">
                    <UserSupportPanel userId={userId} tickets={userData.tickets} notes={userData.notes} onUpdate={loadUserData} />
                </TabsContent>

                <TabsContent value="audit">
                    <UserAuditView userId={userId} />
                </TabsContent>
            </Tabs>
        </div>
    );
}

export default function UserDetailPage() {
    return (
        <Suspense fallback={
            <div className="flex items-center justify-center h-96">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        }>
            <UserDetailContent />
        </Suspense>
    );
}
