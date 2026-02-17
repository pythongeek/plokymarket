'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useStore } from '@/store/useStore';
import { Loader2, ArrowDownLeft, Wallet } from 'lucide-react';
import { toast } from 'sonner';

export function DepositForm() {
    const { submitDeposit } = useStore();
    const [amount, setAmount] = useState('');
    const [method, setMethod] = useState('Bkash');
    const [trxId, setTrxId] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async () => {
        if (!amount || !trxId) return;

        setIsLoading(true);
        const result = await submitDeposit(parseFloat(amount), method, trxId);

        if (result.success) {
            toast.success(result.message);
            setAmount('');
            setTrxId('');
        } else {
            toast.error(result.message);
        }
        setIsLoading(false);
    };

    return (
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Deposit Funds</CardTitle>
                        <CardDescription>Add funds via Mobile Banking</CardDescription>
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                    <Select value={method} onValueChange={setMethod}>
                        <SelectTrigger className="bg-black/40 border-slate-700 h-12">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Bkash">bKash</SelectItem>
                            <SelectItem value="Nagad">Nagad</SelectItem>
                            <SelectItem value="Rocket">Rocket</SelectItem>
                            <SelectItem value="Upay">Upay</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (BDT)</label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="Min: 100"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-black/40 border-slate-700 font-mono text-lg"
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Transaction ID (TrxID)</label>
                    <Input
                        placeholder="e.g. 9H76T..."
                        value={trxId}
                        onChange={(e) => setTrxId(e.target.value)}
                        className="bg-black/40 border-slate-700 font-mono uppercase"
                    />
                    <p className="text-[10px] text-slate-500">
                        * Please send money to <strong>01700000000</strong> (Personal) and enter TrxID here.
                    </p>
                </div>

                <div className="pt-4">
                    <Button
                        className="w-full h-12 text-md font-bold bg-emerald-600 hover:bg-emerald-500"
                        onClick={handleSubmit}
                        disabled={isLoading || !amount || !trxId || parseFloat(amount) < 100}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Submitting...
                            </>
                        ) : (
                            <>
                                Deposit Funds <ArrowDownLeft className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}
