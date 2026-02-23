'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';
import { Loader2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { useStore } from '@/store/useStore';
import { useExchangeRate } from '@/hooks/useExchangeRate';
import { ExchangeRateBadge } from '@/components/ExchangeRateBadge';

const depositSchema = z.object({
    mfs_provider: z.enum(['bkash', 'nagad', 'rocket', 'upay']),
    bdt_amount: z.number().min(500, 'Minimum deposit is 500 BDT'),
    txn_id: z.string().min(6, 'Valid Transaction ID is required'),
    sender_number: z.string().regex(/^(?:\+88|88)?(01[3-9]\d{8})$/, 'Invalid Bangladeshi phone number'),
});

type DepositFormValues = z.infer<typeof depositSchema>;

interface DepositFormProps {
    onSuccess?: () => void;
}

export function DepositForm({ onSuccess }: DepositFormProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const { rate, isLoading: isRateLoading } = useExchangeRate();
    const { toast } = useToast();
    const { fetchTransactions } = useStore();
    const supabase = createClient();

    const form = useForm<DepositFormValues>({
        resolver: zodResolver(depositSchema),
        defaultValues: {
            bdt_amount: 500,
            txn_id: '',
            sender_number: '',
        },
    });

    const watchAmount = form.watch('bdt_amount');
    const watchProvider = form.watch('mfs_provider');

    const onSubmit = async (data: DepositFormValues) => {
        setIsSubmitting(true);
        try {
            const res = await fetch('/api/wallet/deposit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(data),
            });

            const result = await res.json();

            if (!res.ok) throw new Error(result.error || 'Deposit submission failed');

            toast({
                title: 'Deposit Request Submitted',
                description: `Successfully queued ${Number((data.bdt_amount / rate).toFixed(2))} USDT for verification.`,
            });

            form.reset();
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
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle>MFS Deposit (bKash/Nagad)</CardTitle>
                <ExchangeRateBadge />
            </CardHeader>
            <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg mb-6 text-sm">
                    <p className="font-semibold mb-2">Instructions:</p>
                    <ol className="list-decimal pl-4 space-y-1">
                        <li>Send BDT to our Merchant Agent Number: <strong>01712345678</strong></li>
                        <li>Copy the Transaction ID from the MFS App.</li>
                        <li>Fill out this form and submit.</li>
                    </ol>
                </div>

                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="space-y-2">
                        <Label>MFS Provider</Label>
                        <Select onValueChange={(val) => form.setValue('mfs_provider', val as any)}>
                            <SelectTrigger>
                                <SelectValue placeholder="Select Provider" />
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
                        <Label>Amount (BDT)</Label>
                        <Input type="number" {...form.register('bdt_amount', { valueAsNumber: true })} />
                        {form.formState.errors.bdt_amount && (
                            <p className="text-sm text-destructive">{form.formState.errors.bdt_amount.message}</p>
                        )}
                        <p className="text-xs text-muted-foreground">
                            You will receive approximately ≈ <strong>{watchAmount ? (watchAmount / rate).toFixed(2) : 0} USDT</strong>
                        </p>
                    </div>

                    <div className="space-y-2">
                        <Label>Sender Phone Number</Label>
                        <Input placeholder="017xxxxxxxx" {...form.register('sender_number')} />
                        {form.formState.errors.sender_number && (
                            <p className="text-sm text-destructive">{form.formState.errors.sender_number.message}</p>
                        )}
                    </div>

                    <div className="space-y-2">
                        <Label>Transaction ID (TrxID)</Label>
                        <Input placeholder="9A7B6C5D4E" {...form.register('txn_id')} />
                        {form.formState.errors.txn_id && (
                            <p className="text-sm text-destructive">{form.formState.errors.txn_id.message}</p>
                        )}
                    </div>

                    <Button type="submit" className="w-full" disabled={isSubmitting || !watchProvider}>
                        {isSubmitting ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting Request...
                            </>
                        ) : (
                            'Verify Deposit'
                        )}
                    </Button>
                </form>
            </CardContent>
        </Card>
    );
}
