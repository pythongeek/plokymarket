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

const withdrawSchema = z.object({
    mfs_provider: z.enum(['bkash', 'nagad', 'rocket', 'upay']),
    usdt_amount: z.number().min(5, 'Minimum withdrawal is 5 USDT'),
    recipient_number: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'Invalid Bangladeshi phone number'),
});

type WithdrawFormValues = z.infer<typeof withdrawSchema>;

interface WithdrawalFormProps {
    onSuccess?: () => void;
}

export function WithdrawalForm({ onSuccess }: WithdrawalFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [currentRate, setCurrentRate] = useState<number>(100);
    const { toast } = useToast();
    const { wallet, fetchWallet, fetchTransactions } = useStore();

    const supabase = createClient();

    const availableBalance = wallet?.balance || 0;

    const form = useForm<WithdrawFormValues>({
        resolver: zodResolver(withdrawSchema),
        defaultValues: {
            usdt_amount: 5,
            recipient_number: '',
        },
    });

    const watchAmount = form.watch('usdt_amount');

    useEffect(() => {
        const fetchRate = async () => {
            const { data } = await supabase
                .from('exchange_rates')
                .select('usdt_to_bdt')
                .order('created_at', { ascending: false })
                .limit(1)
                .single();
            if (data) setCurrentRate(data.usdt_to_bdt);
        };
        fetchRate();
    }, [supabase]);

    const onSubmit = async (data: WithdrawFormValues) => {
        if (data.usdt_amount > availableBalance) {
            form.setError('usdt_amount', { type: 'manual', message: 'Insufficient Available Balance' });
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

            if (!res.ok) throw new Error(result.error || 'Withdrawal request failed');

            toast({
                title: 'Withdrawal Initiated',
                description: `Funds locked. You will receive ${Number((data.usdt_amount * currentRate).toFixed(2))} BDT to your MFS address shortly.`,
            });

            form.reset();
            fetchWallet(); // Refresh balance (Available -> Locked)
            fetchTransactions(); // Refresh UI queues
            if (onSuccess) onSuccess();
        } catch (err: any) {
            toast({
                title: 'Error',
                description: err.message,
                variant: 'destructive',
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Card className="w-full max-w-md mx-auto">
            <CardHeader>
                <CardTitle>Withdraw to MFS</CardTitle>
                <CardDescription>Available Balance: {availableBalance.toFixed(2)} USDT</CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>MFS Provider</Label>
                        <Select onValueChange={(val) => form.setValue('mfs_provider', val as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Destination" />
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
                        <Label>Amount (USDT)</Label>
                        <div className="flex gap-2">
                            <Input type="number" step="0.01" {...form.register('usdt_amount', { valueAsNumber: true })} />
                            <Button type="button" variant="outline" onClick={() => form.setValue('usdt_amount', Number(availableBalance.toFixed(2)))}>MAX</Button>
                        </div>
                        {form.formState.errors.usdt_amount && (
                            <p className="text-sm text-destructive">{form.formState.errors.usdt_amount.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" />
                            You will receive exactly: <strong>{watchAmount ? (watchAmount * currentRate).toFixed(2) : 0} BDT</strong>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Recipient Phone Number</Label>
                        <Input placeholder="017xxxxxxxx" {...form.register('recipient_number')} />
                        {form.formState.errors.recipient_number && (
                            <p className="text-sm text-destructive">{form.formState.errors.recipient_number.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting || availableBalance < 5}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing...
                            </>
                        ) : (
                            'Confirm Withdrawal'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
