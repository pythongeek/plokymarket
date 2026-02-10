'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    User,
    Mail,
    Phone,
    MapPin,
    Calendar,
    Shield,
    TrendingUp,
    Wallet,
    Activity,
    Globe,
    CreditCard,
    CheckCircle,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface UserOverviewViewProps {
    userId: string;
    userData: any;
    onUpdate: () => void;
    tradingOnly?: boolean;
}

export function UserOverviewView({ userId, userData, onUpdate, tradingOnly }: UserOverviewViewProps) {
    const { profile, kyc, status } = userData;

    if (tradingOnly) {
        return (
            <div className="space-y-6">
                {/* Trading Stats */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">মোট ট্রেড</p>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        {(profile.total_trades || 0).toLocaleString('bn-BD')}
                                    </p>
                                </div>
                                <TrendingUp className="w-5 h-5 text-blue-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">মোট ভলিউম</p>
                                    <p className="text-2xl font-bold text-white mt-1">
                                        ৳{((profile.total_volume || 0) / 1000).toFixed(1)}K
                                    </p>
                                </div>
                                <Activity className="w-5 h-5 text-emerald-400" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="bg-slate-900 border-slate-800">
                        <CardContent className="p-5">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-xs text-slate-500">মোট PnL</p>
                                    <p className={cn(
                                        "text-2xl font-bold mt-1",
                                        (profile.total_realized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'
                                    )}>
                                        {(profile.total_realized_pnl || 0) >= 0 ? '+' : ''}৳{(profile.total_realized_pnl || 0).toLocaleString('bn-BD')}
                                    </p>
                                </div>
                                <Wallet className="w-5 h-5 text-violet-400" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Open Positions */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                            <Activity className="w-4 h-4 text-primary" />
                            ওপেন পজিশন ({(profile.open_positions_count || 0).toLocaleString('bn-BD')})
                        </CardTitle>
                        <CardDescription className="text-slate-500">
                            মোট মূল্য: ৳{((profile.open_positions_value || 0) / 1000).toFixed(1)}K
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="text-center py-8 text-slate-500">
                            <Activity className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>পজিশনের বিস্তারিত তথ্য API থেকে লোড হবে</p>
                            <p className="text-xs mt-1">Position details will load from API</p>
                        </div>
                    </CardContent>
                </Card>

                {/* Trading Permissions */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white text-sm">ট্রেডিং অনুমতি</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {[
                                { label: 'ট্রেড করতে পারেন', value: status?.can_trade, icon: TrendingUp },
                                { label: 'জমা দিতে পারেন', value: status?.can_deposit, icon: CreditCard },
                                { label: 'উত্তোলন করতে পারেন', value: status?.can_withdraw, icon: Wallet },
                            ].map((perm) => (
                                <div key={perm.label} className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                                    <div className="flex items-center gap-3">
                                        <perm.icon className="w-4 h-4 text-slate-500" />
                                        <span className="text-sm text-slate-300">{perm.label}</span>
                                    </div>
                                    <Badge className={perm.value !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                                        {perm.value !== false ? 'হ্যাঁ' : 'না'}
                                    </Badge>
                                </div>
                            ))}
                        </div>

                        {status?.trading_restricted_until && (
                            <div className="mt-4 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                                <div className="flex items-center gap-2 text-amber-400 text-sm">
                                    <Clock className="w-4 h-4" />
                                    <span>ট্রেডিং সীমাবদ্ধ: {new Date(status.trading_restricted_until).toLocaleDateString('bn-BD')} পর্যন্ত</span>
                                </div>
                                {status.restriction_reason && (
                                    <p className="text-xs text-slate-400 mt-2">কারণ: {status.restriction_reason}</p>
                                )}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        );
    }

    // Full Overview
    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Personal Information */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                            <User className="w-4 h-4 text-primary" />
                            ব্যক্তিগত তথ্য
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        {[
                            { icon: Mail, label: 'ইমেইল', value: profile.email },
                            { icon: User, label: 'পুরো নাম', value: profile.full_name || 'নেই' },
                            { icon: Calendar, label: 'যোগদান', value: profile.created_at ? new Date(profile.created_at).toLocaleDateString('bn-BD') : 'N/A' },
                            { icon: Clock, label: 'শেষ লগইন', value: profile.last_sign_in_at ? new Date(profile.last_sign_in_at).toLocaleDateString('bn-BD', { hour: '2-digit', minute: '2-digit' }) : 'কখনও না' },
                            { icon: Globe, label: 'জাতীয়তা', value: kyc?.nationality || 'বাংলাদেশী' },
                            { icon: Phone, label: 'ফোন', value: kyc?.phone_number || 'নেই' },
                            { icon: MapPin, label: 'ঠিকানা', value: kyc?.address_line1 ? `${kyc.address_line1}, ${kyc.city || ''}` : 'নেই' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                                <item.icon className="w-4 h-4 text-slate-500" />
                                <span className="text-xs text-slate-500 w-24">{item.label}</span>
                                <span className="text-sm text-white flex-1">{item.value}</span>
                            </div>
                        ))}
                    </CardContent>
                </Card>

                {/* KYC & Verification */}
                <Card className="bg-slate-900 border-slate-800">
                    <CardHeader>
                        <CardTitle className="text-white text-sm flex items-center gap-2">
                            <Shield className="w-4 h-4 text-primary" />
                            KYC এবং যাচাইকরণ
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                                <p className="text-xs text-slate-500 mb-1">যাচাইকরণ স্ট্যাটাস</p>
                                <Badge className={cn(
                                    kyc?.verification_status === 'verified' ? 'bg-emerald-500/20 text-emerald-400' :
                                        kyc?.verification_status === 'pending' ? 'bg-blue-500/20 text-blue-400' :
                                            'bg-amber-500/20 text-amber-400'
                                )}>
                                    {kyc?.verification_status === 'verified' ? 'যাচাইকৃত' :
                                        kyc?.verification_status === 'pending' ? 'মুলতুবি' : 'অযাচাইকৃত'}
                                </Badge>
                            </div>
                            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                                <p className="text-xs text-slate-500 mb-1">যাচাইকরণ টিয়ার</p>
                                <Badge variant="outline" className="border-slate-700 text-slate-300 capitalize">
                                    {kyc?.verification_tier || profile.verification_tier || 'basic'}
                                </Badge>
                            </div>
                        </div>

                        {/* BD-specific KYC fields */}
                        {[
                            { label: 'পরিচয়পত্রের ধরন', value: kyc?.id_type === 'nid' ? 'জাতীয় পরিচয়পত্র (NID)' : kyc?.id_type === 'passport' ? 'পাসপোর্ট' : kyc?.id_type === 'birth_certificate' ? 'জন্ম নিবন্ধন' : kyc?.id_type || 'নেই' },
                            { label: 'পরিচয়পত্র নম্বর', value: kyc?.id_number ? `***${kyc.id_number.slice(-4)}` : 'নেই' },
                            { label: 'ফোন যাচাই', value: kyc?.phone_verified ? '✅ যাচাইকৃত' : '❌ অযাচাইকৃত' },
                            { label: 'দৈনিক জমার সীমা', value: kyc?.daily_deposit_limit ? `৳${kyc.daily_deposit_limit.toLocaleString('bn-BD')}` : 'N/A' },
                            { label: 'দৈনিক উত্তোলন সীমা', value: kyc?.daily_withdrawal_limit ? `৳${kyc.daily_withdrawal_limit.toLocaleString('bn-BD')}` : 'N/A' },
                        ].map((item) => (
                            <div key={item.label} className="flex items-center gap-3 py-2 border-b border-slate-800 last:border-0">
                                <span className="text-xs text-slate-500 w-36">{item.label}</span>
                                <span className="text-sm text-white flex-1">{item.value}</span>
                            </div>
                        ))}

                        {/* Risk Factors */}
                        {kyc?.risk_factors && kyc.risk_factors.length > 0 && (
                            <div className="mt-4">
                                <p className="text-xs text-slate-500 mb-2">ঝুঁকির কারণসমূহ</p>
                                <div className="flex flex-wrap gap-1">
                                    {kyc.risk_factors.map((factor: string, i: number) => (
                                        <Badge key={i} className="bg-red-500/10 text-red-400 text-xs">
                                            {factor}
                                        </Badge>
                                    ))}
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Quick Trading Summary */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        ট্রেডিং সারসংক্ষেপ
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                        {[
                            { label: 'মোট ট্রেড', value: (profile.total_trades || 0).toLocaleString('bn-BD') },
                            { label: 'মোট ভলিউম', value: `৳${((profile.total_volume || 0) / 1000).toFixed(1)}K` },
                            { label: 'PnL', value: `${(profile.total_realized_pnl || 0) >= 0 ? '+' : ''}৳${(profile.total_realized_pnl || 0).toLocaleString('bn-BD')}`, color: (profile.total_realized_pnl || 0) >= 0 ? 'text-emerald-400' : 'text-red-400' },
                            { label: 'ওপেন পজিশন', value: (profile.open_positions_count || 0).toString() },
                            { label: 'পজিশন মূল্য', value: `৳${((profile.open_positions_value || 0) / 1000).toFixed(1)}K` },
                        ].map((stat) => (
                            <div key={stat.label} className="p-3 rounded-xl bg-slate-950 border border-slate-800 text-center">
                                <p className="text-[10px] text-slate-500 mb-1">{stat.label}</p>
                                <p className={cn("text-sm font-bold text-white", stat.color)}>{stat.value}</p>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
