// @ts-nocheck
'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, AlertCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ExchangeRateBadge } from '@/components/ExchangeRateBadge';

const withdrawSchema = z.object({
    mfs_provider: z.enum(['bkash', 'nagad', 'rocket', 'upay']),
    usdt_amount: z.number().min(5, 'নিন্নতম উত্তোলন 5 USDT'),
    recipient_number: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'বাংলাদেশী ফোন নম্বর সঠিক নয়'),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

interface WithdrawalFormProps {
    onSuccess?: () => void;
}

export function WithdrawalForm({ onSuccess }: WithdrawalFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [securityStatus, setSecurityStatus] = useState<'ok' | 'pending' | 'kyc' | 'checking'>('checking');
    const { rate, isLoading: isRateLoading } = useExchangeRate();
    const { toast } = useToast();
    const { wallet, fetchWallet, fetchTransactions } = useStore();
    const supabase = createClient();

    const availableBalance = wallet?.balance || 0;

    useEffect(() => {
        checkSecurity();
    }, []);

    const checkSecurity = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { setSecurityStatus('kyc'); return; }
        const { data: profile } = await supabase.from('user_profiles').select('kyc_verified').eq('id', user.id).single();
        if (!profile?.kyc_verified) { setSecurityStatus('kyc'); return; }
        const { data: pending } = await supabase.from('withdrawal_requests').select('id').eq('user_id', user.id).eq('status', 'pending');
        if (pending && pending.length > 0) { setSecurityStatus('pending'); return; }
        setSecurityStatus('ok');
    };

    const form = useForm<WithdrawFormValues>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            usdt_amount: 5,
            recipient_number: '',
        },
    });

    const watchAmount = form.watch('usdt_amount');

    const onSubmit = async (data: WithdrawFormValues) => {
        if (data.usdt_amount > availableBalance) {
            form.setError('usdt_amount', { type: 'manual', message: 'অপর্যাপ্ত ব্যালেন্স' });
            return;
        }
        if (securityStatus !== 'ok') {
            toast({ title: 'নিরাপত্তা ব্যর্থ', description: 'উত্তোলনের সমস্ত শর্ত পূরণ হয়নি', variant: 'destructive' });
            return;
        }

        setIsSubmitting(true);
        try {
            const res = await fetch('/api/wallet/withdraw', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'উত্তোলন ব্যর্থ');

            toast({
                title: 'উত্তোলন সক্ষম',
                description: `নিরাপত্তা লক হয়েছে। আপনি শীঘ্রই ${Number((data.usdt_amount * rate).toFixed(2))} বিডিটি পাবেন।`,
            });

            form.reset();
            fetchWallet();
            fetchTransactions();
            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast({
                title: 'ত্রুটি',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    const securityMessage = {
        checking: { title: 'নিরাপত্তা যাচাই করা হচ্ছে...', desc: '', color: 'bg-slate-500/10 border-slate-500/30 text-slate-400' },
        kyc: { title: 'KYC ভেরিফিকেশন প্রয়োজন', desc: 'উত্তোলন করতে KYC সম্পন্ন করুন', color: 'bg-yellow-500/10 border-yellow-500/30 text-yellow-400' },
        pending: { title: 'বিতর্ণমান উত্তোলন রয়েছে', desc: 'আপনার একটি উত্তোলন বিনিময় রয়েছে', color: 'bg-blue-500/10 border-blue-500/30 text-blue-400' },
        ok: { title: '', desc: '', color: '' },
    }[securityStatus];

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle>MFS-ই উত্তোলন</CardTitle>
                    <ExchangeRateBadge />
                </div>
                <CardDescription>উপলব্ধ ব্যালেন্স: {availableBalance.toFixed(2)} USDT</CardDescription>
            </CardHeader>
            <CardContent>
                {securityStatus !== 'ok' && securityMessage.title && (
                    <div className={`rounded-lg p-4 mb-4 border ${securityMessage.color}`}>
                        <div className="flex items-center gap-2 font-bold">
                            <AlertCircle className="w-4 h-4" />
                            {securityMessage.title}
                        </div>
                        {securityMessage.desc && <p className="text-sm mt-1">{securityMessage.desc}</p>}
                    </div>
                )}
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>MFS প্রোভাইডার</Label>
                        <Select onValueChange={(val) => form.setValue('mfs_provider', val as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="দেশ নির্বাচন করুন" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="bkash">bKash</SelectItem>
                                <SelectItem value="nagad">Nagad</SelectItem>
                                <SelectItem value="rocket">Rocket</SelectItem>
                                <SelectItem value="upay">Upay</SelectItem>
                            </SelectContent>
                        </Select>
                        {form.formState.errors.mfs_provider && (
                            <p className="text-sm text-destructive">{form.formState.errors.mfs_provider.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>পরিমাণ (USDT)</Label>
                        <div className="flex gap-2">
                            <Input type="number" step="0.01" {...form.register('usdt_amount', { valueAsNumber: true })} />
                            <Button type="button" variant="outline" onClick={() => form.setValue('usdt_amount', Number(availableBalance.toFixed(2)))}>MAX</Button>
                        </div>
                        {form.formState.errors.usdt_amount && (
                            <p className="text-sm text-destructive">{form.formState.errors.usdt_amount.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            আপনি নির্দিষ্ট পাবেন: <strong>{watchAmount ? (watchAmount * rate).toFixed(2) : 0} BDT</strong>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>প্রাপ্তকারীর ফোন নম্বর</Label>
                        <Input placeholder="017xxxxxxxx" {...form.register('recipient_number')} />
                        {form.formState.errors.recipient_number && (
                            <p className="text-sm text-destructive">{form.formState.errors.recipient_number.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting || availableBalance < 5 || securityStatus !== 'ok'}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                প্রসেসিং...
                            </>
                        ) : (
                            'উত্তোলন নিশ্চিত করুন'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
