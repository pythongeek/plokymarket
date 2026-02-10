'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    AlertTriangle,
    Zap,
    TrendingDown,
    Bell,
    BellOff,
    Loader2,
    CheckCircle,
    XCircle,
    Activity,
    DollarSign,
    Clock,
    Shield,
} from 'lucide-react';
import { userManagementService, type PositionIntervention } from '@/lib/user-management/service';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
} from '@/components/ui/dialog';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/lib/utils';

interface UserInterventionViewProps {
    userId: string;
    profile: any;
    onUpdate: () => void;
}

export function UserInterventionView({ userId, profile, onUpdate }: UserInterventionViewProps) {
    const [interventions, setInterventions] = useState<PositionIntervention[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [showInterventionDialog, setShowInterventionDialog] = useState(false);
    const [interventionForm, setInterventionForm] = useState({
        type: 'margin_call' as 'liquidation' | 'forced_closure' | 'margin_call',
        reason: '',
        sendNotification: true,
        positionId: '',
    });

    useEffect(() => {
        loadInterventions();
    }, [userId]);

    const loadInterventions = async () => {
        setLoading(true);
        try {
            const data = await userManagementService.getInterventions(userId);
            setInterventions(data);
        } catch (error) {
            console.error('Error loading interventions:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleIntervention = async () => {
        if (!interventionForm.reason.trim()) return;

        setActionLoading(true);
        try {
            await userManagementService.performIntervention({
                user_id: userId,
                position_id: interventionForm.positionId || undefined,
                intervention_type: interventionForm.type,
                reason: interventionForm.reason,
                send_notification: interventionForm.sendNotification,
            });

            setShowInterventionDialog(false);
            setInterventionForm({
                type: 'margin_call',
                reason: '',
                sendNotification: true,
                positionId: '',
            });
            loadInterventions();
            onUpdate();
        } catch (error: any) {
            console.error('Intervention error:', error);
            alert(`ত্রুটি: ${error.message}`);
        } finally {
            setActionLoading(false);
        }
    };

    const interventionTypes = [
        {
            type: 'margin_call' as const,
            label: 'মার্জিন কল',
            labelEn: 'Margin Call',
            description: 'ব্যবহারকারীকে অতিরিক্ত তহবিল জমা দিতে বলুন',
            icon: AlertTriangle,
            color: 'text-amber-400',
            bg: 'bg-amber-500/10',
            border: 'border-amber-500/30',
        },
        {
            type: 'forced_closure' as const,
            label: 'জোরপূর্বক বন্ধ',
            labelEn: 'Forced Closure',
            description: 'ঝুঁকিপূর্ণ পজিশন জোরপূর্বক বন্ধ করুন',
            icon: Zap,
            color: 'text-orange-400',
            bg: 'bg-orange-500/10',
            border: 'border-orange-500/30',
        },
        {
            type: 'liquidation' as const,
            label: 'লিকুইডেশন',
            labelEn: 'Liquidation',
            description: 'সমস্ত পজিশন তাৎক্ষণিকভাবে বন্ধ করুন',
            icon: TrendingDown,
            color: 'text-red-400',
            bg: 'bg-red-500/10',
            border: 'border-red-500/30',
        },
    ];

    const getTypeConfig = (type: string) => {
        return interventionTypes.find(t => t.type === type) || interventionTypes[0];
    };

    return (
        <div className="space-y-6">
            {/* Action Cards */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-primary" />
                        হস্তক্ষেপ কার্যক্রম
                    </CardTitle>
                    <CardDescription className="text-slate-500">
                        Position Intervention — Liquidation, Forced Closure, Margin Call
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* Position Summary */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Activity className="w-4 h-4 text-blue-400" />
                                <span className="text-xs text-slate-500">ওপেন পজিশন</span>
                            </div>
                            <p className="text-xl font-bold text-white">{(profile.open_positions_count || 0).toLocaleString('bn-BD')}</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                                <DollarSign className="w-4 h-4 text-emerald-400" />
                                <span className="text-xs text-slate-500">পজিশন মূল্য</span>
                            </div>
                            <p className="text-xl font-bold text-white">৳{((profile.open_positions_value || 0) / 1000).toFixed(1)}K</p>
                        </div>
                        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2 mb-1">
                                <Shield className="w-4 h-4 text-violet-400" />
                                <span className="text-xs text-slate-500">ঝুঁকি স্কোর</span>
                            </div>
                            <p className={cn("text-xl font-bold",
                                (profile.risk_score || 0) >= 70 ? 'text-red-400' :
                                    (profile.risk_score || 0) >= 40 ? 'text-amber-400' :
                                        'text-emerald-400'
                            )}>
                                {profile.risk_score || 0}
                            </p>
                        </div>
                    </div>

                    {/* Intervention Buttons */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                        {interventionTypes.map((intervention) => {
                            const Icon = intervention.icon;
                            return (
                                <button
                                    key={intervention.type}
                                    onClick={() => {
                                        setInterventionForm(prev => ({ ...prev, type: intervention.type }));
                                        setShowInterventionDialog(true);
                                    }}
                                    disabled={profile.open_positions_count === 0}
                                    className={cn(
                                        "flex items-start gap-3 p-4 rounded-xl border transition-all text-left",
                                        profile.open_positions_count === 0
                                            ? "opacity-30 cursor-not-allowed bg-slate-950 border-slate-800"
                                            : `${intervention.bg} ${intervention.border} hover:opacity-90`
                                    )}
                                >
                                    <div className={cn("p-2 rounded-lg bg-slate-900 mt-0.5", intervention.color)}>
                                        <Icon className="w-4 h-4" />
                                    </div>
                                    <div>
                                        <p className={cn("text-sm font-medium", intervention.color)}>{intervention.label}</p>
                                        <p className="text-[10px] text-slate-500 mt-0.5">{intervention.labelEn}</p>
                                        <p className="text-[10px] text-slate-600 mt-1">{intervention.description}</p>
                                    </div>
                                </button>
                            );
                        })}
                    </div>

                    {profile.open_positions_count === 0 && (
                        <p className="text-xs text-slate-600 text-center mt-3">
                            ব্যবহারকারীর কোনো ওপেন পজিশন নেই। হস্তক্ষেপ করা যাবে না।
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Intervention History */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-sm flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        হস্তক্ষেপের ইতিহাস
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-6 h-6 animate-spin text-primary" />
                        </div>
                    ) : interventions.length === 0 ? (
                        <div className="text-center py-12 text-slate-500">
                            <CheckCircle className="w-12 h-12 mx-auto mb-3 opacity-20" />
                            <p>কোনো হস্তক্ষেপের ইতিহাস নেই</p>
                            <p className="text-xs mt-1">No intervention history</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {interventions.map((intervention) => {
                                const typeConfig = getTypeConfig(intervention.intervention_type);
                                const Icon = typeConfig.icon;

                                return (
                                    <motion.div
                                        key={intervention.id}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className="p-4 rounded-xl bg-slate-950 border border-slate-800"
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex items-start gap-3">
                                                <div className={cn("p-2 rounded-lg", typeConfig.bg, typeConfig.color)}>
                                                    <Icon className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <div className="flex items-center gap-2">
                                                        <span className={cn("text-sm font-medium", typeConfig.color)}>
                                                            {typeConfig.label}
                                                        </span>
                                                        {intervention.notification_sent && (
                                                            <Badge className="bg-blue-500/20 text-blue-400 text-[10px]">
                                                                <Bell className="w-3 h-3 mr-1" />
                                                                বিজ্ঞপ্তি পাঠানো হয়েছে
                                                            </Badge>
                                                        )}
                                                        {intervention.user_acknowledged && (
                                                            <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px]">
                                                                <CheckCircle className="w-3 h-3 mr-1" />
                                                                স্বীকৃত
                                                            </Badge>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-slate-400 mt-1">{intervention.reason}</p>
                                                    {intervention.position_value && (
                                                        <div className="flex gap-4 mt-2 text-xs">
                                                            <span className="text-slate-500">
                                                                মূল্য: ৳{intervention.position_value.toLocaleString('bn-BD')}
                                                            </span>
                                                            {intervention.pnl !== undefined && (
                                                                <span className={intervention.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}>
                                                                    PnL: {intervention.pnl >= 0 ? '+' : ''}৳{intervention.pnl.toLocaleString('bn-BD')}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-[10px] text-slate-500">
                                                    {new Date(intervention.performed_at).toLocaleDateString('bn-BD')}
                                                </p>
                                                <p className="text-[10px] text-slate-600">
                                                    {intervention.performed_by?.full_name || 'Admin'}
                                                </p>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Intervention Dialog */}
            <Dialog open={showInterventionDialog} onOpenChange={setShowInterventionDialog}>
                <DialogContent className="bg-slate-900 border-slate-800 text-white">
                    <DialogHeader>
                        <DialogTitle className="text-white flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-amber-400" />
                            হস্তক্ষেপ নিশ্চিত করুন
                        </DialogTitle>
                        <DialogDescription className="text-slate-400">
                            এই কাজ অডিট লগে রেকর্ড করা হবে এবং ব্যবহারকারীকে রিয়েল-টাইমে বিজ্ঞপ্তি পাঠানো হবে।
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div>
                            <label className="text-sm text-slate-400 block mb-1">হস্তক্ষেপের ধরন</label>
                            <Select
                                value={interventionForm.type}
                                onValueChange={(v) => setInterventionForm(prev => ({ ...prev, type: v as any }))}
                            >
                                <SelectTrigger className="bg-slate-950 border-slate-800 text-white">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent className="bg-slate-900 border-slate-800">
                                    {interventionTypes.map(t => (
                                        <SelectItem key={t.type} value={t.type}>
                                            {t.label} ({t.labelEn})
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div>
                            <label className="text-sm text-slate-400 block mb-1">কারণ (আবশ্যক)</label>
                            <Textarea
                                value={interventionForm.reason}
                                onChange={(e) => setInterventionForm(prev => ({ ...prev, reason: e.target.value }))}
                                placeholder="হস্তক্ষেপের কারণ বিস্তারিত লিখুন..."
                                className="bg-slate-950 border-slate-800 text-white"
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between p-4 rounded-xl bg-slate-950 border border-slate-800">
                            <div className="flex items-center gap-2">
                                {interventionForm.sendNotification ? (
                                    <Bell className="w-4 h-4 text-blue-400" />
                                ) : (
                                    <BellOff className="w-4 h-4 text-slate-500" />
                                )}
                                <span className="text-sm text-slate-300">
                                    ব্যবহারকারীকে রিয়েল-টাইম বিজ্ঞপ্তি পাঠান
                                </span>
                            </div>
                            <Switch
                                checked={interventionForm.sendNotification}
                                onCheckedChange={(checked) => setInterventionForm(prev => ({ ...prev, sendNotification: checked }))}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setShowInterventionDialog(false)}
                            className="border-slate-800 text-slate-400"
                        >
                            বাতিল
                        </Button>
                        <Button
                            onClick={handleIntervention}
                            disabled={!interventionForm.reason.trim() || actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                            হস্তক্ষেপ কার্যকর করুন
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
