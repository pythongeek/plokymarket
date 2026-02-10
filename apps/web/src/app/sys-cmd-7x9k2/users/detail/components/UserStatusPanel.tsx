'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
    Settings,
    Shield,
    UserCheck,
    UserX,
    Ban,
    AlertTriangle,
    CheckCircle,
    Clock,
    Lock,
    Unlock,
    Loader2,
    RefreshCw,
} from 'lucide-react';
import { userManagementService } from '@/lib/user-management/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
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
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

interface UserStatusPanelProps {
    userId: string;
    userData: any;
    onUpdate: () => void;
}

export function UserStatusPanel({ userId, userData, onUpdate }: UserStatusPanelProps) {
    const { profile, status } = userData;
    const [loading, setLoading] = useState(false);
    const [showConfirmDialog, setShowConfirmDialog] = useState(false);
    const [pendingAction, setPendingAction] = useState<{
        type: string;
        changes: any;
        reason: string;
    } | null>(null);
    const [reason, setReason] = useState('');
    const [dualAuthRequired, setDualAuthRequired] = useState(false);
    const [dualAuthAdminId, setDualAuthAdminId] = useState('');
    const [newTier, setNewTier] = useState(profile.verification_tier || 'basic');

    const statusActions = [
        {
            id: 'activate',
            label: 'অ্যাকাউন্ট সক্রিয় করুন',
            labelEn: 'Activate Account',
            icon: UserCheck,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/10 hover:bg-emerald-500/20',
            border: 'border-emerald-500/30',
            changes: { account_status: 'active', can_trade: true, can_deposit: true, can_withdraw: true },
            requiresDualAuth: false,
            disabled: profile.account_status === 'active',
        },
        {
            id: 'suspend',
            label: 'অ্যাকাউন্ট স্থগিত করুন',
            labelEn: 'Suspend Account',
            icon: UserX,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10 hover:bg-amber-500/20',
            border: 'border-amber-500/30',
            changes: { account_status: 'suspended', can_trade: false },
            requiresDualAuth: true,
            disabled: profile.account_status === 'suspended',
        },
        {
            id: 'ban',
            label: 'অ্যাকাউন্ট নিষিদ্ধ করুন',
            labelEn: 'Ban Account',
            icon: Ban,
            color: 'text-red-400',
            bg: 'bg-red-500/10 hover:bg-red-500/20',
            border: 'border-red-500/30',
            changes: { account_status: 'banned', can_trade: false, can_deposit: false, can_withdraw: false },
            requiresDualAuth: true,
            disabled: profile.account_status === 'banned',
        },
        {
            id: 'restrict_trading',
            label: 'ট্রেডিং সীমাবদ্ধ করুন',
            labelEn: 'Restrict Trading',
            icon: Lock,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10 hover:bg-orange-500/20',
            border: 'border-orange-500/30',
            changes: { can_trade: false },
            requiresDualAuth: false,
            disabled: status?.can_trade === false,
        },
        {
            id: 'unrestrict_trading',
            label: 'ট্রেডিং চালু করুন',
            labelEn: 'Enable Trading',
            icon: Unlock,
            color: 'text-blue-400',
            bg: 'bg-blue-500/10 hover:bg-blue-500/20',
            border: 'border-blue-500/30',
            changes: { can_trade: true },
            requiresDualAuth: false,
            disabled: status?.can_trade !== false,
        },
    ];

    const handleAction = (action: typeof statusActions[0]) => {
        setPendingAction({
            type: action.id,
            changes: action.changes,
            reason: '',
        });
        setDualAuthRequired(action.requiresDualAuth);
        setReason('');
        setDualAuthAdminId('');
        setShowConfirmDialog(true);
    };

    const handleConfirm = async () => {
        if (!pendingAction || !reason.trim()) return;

        setLoading(true);
        try {
            const result = await userManagementService.updateUserStatus(
                userId,
                pendingAction.changes,
                reason,
                dualAuthRequired ? dualAuthAdminId || undefined : undefined,
            );

            if (result.requires_dual_auth) {
                setDualAuthRequired(true);
                alert('দ্বৈত অনুমোদন প্রয়োজন। অনুগ্রহ করে দ্বিতীয় অ্যাডমিনের ID প্রদান করুন।');
                return;
            }

            setShowConfirmDialog(false);
            setPendingAction(null);
            onUpdate();
        } catch (error: any) {
            console.error('Status update error:', error);
            if (error.message?.includes('dual')) {
                setDualAuthRequired(true);
                alert('দ্বৈত অনুমোদন প্রয়োজন। (Dual authorization required)');
            } else {
                alert(`ত্রুটি: ${error.message}`);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleTierChange = async () => {
        if (newTier === (profile.verification_tier || 'basic')) return;

        setLoading(true);
        try {
            await userManagementService.updateUserStatus(
                userId,
                { verification_tier: newTier } as any,
                `Tier changed to ${newTier}`,
            );
            onUpdate();
        } catch (error: any) {
            console.error('Tier update error:', error);
            alert(`ত্রুটি: ${error.message}`);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Current Status Summary */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Settings className="w-4 h-4 text-primary" />
                        বর্তমান স্ট্যাটাস
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Current account status and permissions
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">অ্যাকাউন্ট স্ট্যাটাস</p>
                            <Badge className={cn(
                                profile.account_status === 'active' ? 'bg-emerald-500/20 text-emerald-400' :
                                    profile.account_status === 'suspended' ? 'bg-red-500/20 text-red-400' :
                                        profile.account_status === 'banned' ? 'bg-red-700/20 text-red-500' :
                                            'bg-slate-700 text-slate-400'
                            )}>
                                {profile.account_status === 'active' ? 'সক্রিয়' :
                                    profile.account_status === 'suspended' ? 'স্থগিত' :
                                        profile.account_status === 'banned' ? 'নিষিদ্ধ' : 'নিষ্ক্রিয়'}
                            </Badge>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">ট্রেডিং</p>
                            <Badge className={status?.can_trade !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                                {status?.can_trade !== false ? '✅ চালু' : '🚫 বন্ধ'}
                            </Badge>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">জমা</p>
                            <Badge className={status?.can_deposit !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                                {status?.can_deposit !== false ? '✅ চালু' : '🚫 বন্ধ'}
                            </Badge>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <p className="text-[10px] text-slate-500 mb-1">উত্তোলন</p>
                            <Badge className={status?.can_withdraw !== false ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}>
                                {status?.can_withdraw !== false ? '✅ চালু' : '🚫 বন্ধ'}
                            </Badge>
                        </div>
                    </div>

                    {/* Suspension Details */}
                    {profile.account_status === 'suspended' && status?.suspended_at && (
                        <div className="mt-4 p-4 rounded-xl bg-red-500/5 border border-red-500/20">
                            <div className="flex items-center gap-2 text-red-400 text-sm mb-2">
                                <AlertTriangle className="w-4 h-4" />
                                <span className="font-medium">স্থগিত করা হয়েছে</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-xs">
                                <div>
                                    <span className="text-slate-500">তারিখ: </span>
                                    <span className="text-slate-300">{new Date(status.suspended_at).toLocaleDateString('bn-BD')}</span>
                                </div>
                                {status.suspension_reason && (
                                    <div>
                                        <span className="text-slate-500">কারণ: </span>
                                        <span className="text-slate-300">{status.suspension_reason}</span>
                                    </div>
                                )}
                                {status.appeal_submitted && (
                                    <div className="col-span-2">
                                        <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                                            আপিল জমা দেওয়া হয়েছে
                                        </Badge>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Status Actions */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        স্ট্যাটাস পরিবর্তন
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        ⚠️ কিছু কাজে দ্বৈত অনুমোদন প্রয়োজন হতে পারে
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                        {statusActions.map((action) => {
                            const Icon = action.icon;
                            return (
                                <button
                                    key={action.id}
                                    onClick={() => handleAction(action)}
                                    disabled={action.disabled || loading}
                                    className={cn(
                                        "flex items-center gap-3 p-4 rounded-xl border transition-all text-left",
                                        action.disabled
                                            ? "opacity-30 cursor-not-allowed bg-slate-950 border-slate-800"
                                            : `${action.bg} ${action.border}`
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg bg-slate-900", action.color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={cn("text-sm font-medium", action.color)}>{action.label}</p>
                                        <p className="text-[10px] text-slate-500">{action.labelEn}</p>
                                        {action.requiresDualAuth && !action.disabled && (
                                            <p className="text-[10px] text-amber-400 mt-0.5">🔐 দ্বৈত অনুমোদন</p>
                                        )}
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                </CardContent>
            </Card>

            {/* Verification Tier */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Shield className="w-4 h-4 text-primary" />
                        যাচাইকরণ টিয়ার পরিবর্তন
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-4">
                        <div className="flex-1">
                            <p className="text-xs text-slate-500 mb-2">বর্তমান টিয়ার: <span className="capitalize text-white">{profile.verification_tier || 'basic'}</span></p>
                            <Select value={newTier} onValueChange={setNewTier}>
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    <SelectItem value="basic">বেসিক (Basic) — ৳5,000 দৈনিক সীমা</SelectItem>
                                    <SelectItem value="standard">স্ট্যান্ডার্ড (Standard) — ৳50,000 দৈনিক সীমা</SelectItem>
                                    <SelectItem value="premium">প্রিমিয়াম (Premium) — ৳500,000 দৈনিক সীমা</SelectItem>
                                    <SelectItem value="institutional">প্রাতিষ্ঠানিক (Institutional) — সীমাহীন</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <Button
                            onClick={handleTierChange}
                            disabled={newTier === (profile.verification_tier || 'basic') || loading}
                            className="mt-6"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'আপডেট করুন'}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white">
                            ⚠️ স্ট্যাটাস পরিবর্তন নিশ্চিত করুন
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            এই পরিবর্তন অডিট লগে রেকর্ড করা হবে এবং ব্যবহারকারীকে বিজ্ঞপ্তি পাঠানো হবে।
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 block mb-1">কারণ (আবশ্যক)</label>
                            <Textarea
                                value={reason}
                                onChange={(e) => setReason(e.target.value)}
                                placeholder="পরিবর্তনের কারণ লিখুন..."
                                className="bg-slate-950 border-slate-800 text-white"
                                rows={3}
                            />
                        </div>

                        {dualAuthRequired && (
                            <div>
                                <label className="text-sm text-amber-400 block mb-1">
                                    🔐 দ্বিতীয় অ্যাডমিনের ID (দ্বৈত অনুমোদন)
                                </label>
                                <Input
                                    value={dualAuthAdminId}
                                    onChange={(e) => setDualAuthAdminId(e.target.value)}
                                    placeholder="দ্বিতীয় অনুমোদনকারী অ্যাডমিনের ID"
                                    className="bg-slate-950 border-slate-800 text-white"
                                />
                                <p className="text-[10px] text-slate-500 mt-1">
                                    এই কাজে দ্বৈত অনুমোদন প্রয়োজন। অন্য একজন অ্যাডমিনের ID দিন।
                                </p>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowConfirmDialog(false)}
                            className="border-slate-800 text-slate-400"
                        >
                            বাতিল
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={!reason.trim() || loading}
                            className="bg-primary"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            নিশ্চিত করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
