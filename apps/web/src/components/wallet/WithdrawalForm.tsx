'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useStore } from '@/store/useStore';
import { AlertCircle, ArrowUpRight, ShieldAlert, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

export function WithdrawalForm() {
    const { wallet, withdrawFunds } = useStore();
    const [amount, setAmount] = useState('');
    const [address, setAddress] = useState('');
    const [network, setNetwork] = useState('TRC20');
    const [isLoading, setIsLoading] = useState(false);
    const [kycError, setKycError] = useState(false);

    const handleMax = () => {
        if (wallet) {
            setAmount(wallet.balance.toString());
        }
    };

    const handleWithdraw = async () => {
        if (!amount || !address) return;

        setIsLoading(true);
        setKycError(false);

        const result = await withdrawFunds(parseFloat(amount), address, network);

        if (result.success) {
            toast.success('Withdrawal request submitted successfully');
            setAmount('');
            setAddress('');
        } else {
            if (result.message === 'LIMIT_EXCEEDED_KYC_REQUIRED') {
                setKycError(true);
            } else {
                toast.error(result.message);
            }
        }
        setIsLoading(false);
    };

    return (
        <Card className="bg-slate-900/40 border-slate-800 backdrop-blur-md h-full">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle>Withdraw Funds</CardTitle>
                        <CardDescription>Transfer funds to your external wallet</CardDescription>
                    </div>
                    <div className="flex gap-2">
                        {['TRC20', 'ERC20', 'BEP20'].map(n => (
                            <button
                                key={n}
                                onClick={() => setNetwork(n)}
                                className={cn(
                                    "px-3 py-1 text-xs rounded-full font-bold transition-all",
                                    network === n ? "bg-indigo-500 text-white" : "bg-slate-800 text-slate-500 hover:text-slate-300"
                                )}
                            >
                                {n}
                            </button>
                        ))}
                    </div>
                </div>
            </CardHeader>
            <CardContent className="space-y-6">
                {kycError && (
                    <Alert variant="destructive" className="bg-red-900/20 border-red-900/50">
                        <ShieldAlert className="h-4 w-4" />
                        <AlertTitle>KYC Verification Required</AlertTitle>
                        <AlertDescription className="text-xs mt-2">
                            Withdrawals over 5,000 BDT require Level 1 Identity Verification.
                            <Link href="/kyc" className="block mt-2 font-bold underline hover:text-red-200">
                                Verify Identity Now &rarr;
                            </Link>
                        </AlertDescription>
                    </Alert>
                )}

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Withdrawal Address</label>
                    <Input
                        placeholder={`Enter ${network} Address`}
                        value={address}
                        onChange={(e) => setAddress(e.target.value)}
                        className="bg-black/40 border-slate-700 font-mono"
                    />
                </div>

                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Amount (BDT)</label>
                    <div className="relative">
                        <Input
                            type="number"
                            placeholder="0.00"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            className="bg-black/40 border-slate-700 pr-16"
                        />
                        <button
                            onClick={handleMax}
                            className="absolute right-2 top-1/2 -translate-y-1/2 text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-indigo-500/10"
                        >
                            MAX
                        </button>
                    </div>
                    <div className="flex justify-between text-xs text-slate-500">
                        <span>Available: ৳{wallet?.balance.toLocaleString()}</span>
                        <span>Limit: {wallet?.balance && wallet.balance > 5000 ? 'Requires KYC > 5k' : 'No Limit'}</span>
                    </div>
                </div>

                <div className="pt-4">
                    <Button
                        className="w-full h-12 text-md font-bold bg-indigo-600 hover:bg-indigo-500"
                        onClick={handleWithdraw}
                        disabled={isLoading || !amount || !address || parseFloat(amount) <= 0}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Processing Request...
                            </>
                        ) : (
                            <>
                                Withdraw {amount ? `৳${parseFloat(amount).toLocaleString()}` : ''}
                                <ArrowUpRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                    <p className="text-center text-[10px] text-slate-500 mt-4">
                        Withdrawals are processed within 24 hours. Ensure the network matches your address.
                    </p>
                </div>
            </CardContent>
        </Card>
    );
}
