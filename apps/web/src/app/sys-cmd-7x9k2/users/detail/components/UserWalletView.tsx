'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
    Wallet,
    Plus,
    Minus,
    RefreshCw,
    History,
    Loader2,
    CheckCircle,
    AlertCircle,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface UserWalletViewProps {
    userId: string;
    profile: any;
}

interface WalletData {
    id: string;
    user_id: string;
    balance: number;
    locked_balance: number;
    available_balance: number;
    currency: string;
    created_at: string;
    updated_at: string;
}

interface Transaction {
    id: string;
    transaction_type: string;
    amount: number;
    status: string;
    description: string;
    created_at: string;
}

export function UserWalletView({ userId, profile }: UserWalletViewProps) {
    const [loading, setLoading] = useState(true);
    const [walletData, setWalletData] = useState<WalletData | null>(null);
    const [transactions, setTransactions] = useState<Transaction[]>([]);

    // Credit/Debit form
    const [amount, setAmount] = useState('');
    const [reason, setReason] = useState('');
    const [action, setAction] = useState<'credit' | 'debit'>('credit');
    const [submitting, setSubmitting] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    useEffect(() => {
        loadWalletData();
    }, [userId]);

    const loadWalletData = async () => {
        setLoading(true);
        try {
            // Get wallet data from the profile or via API
            const response = await fetch(`/api/admin/users/wallet?user_id=${userId}`, {
                headers: {
                    'x-user-id': userId // In real implementation, this should be admin's ID
                }
            });
            const result = await response.json();

            if (result.success && result.data) {
                setWalletData(result.data.wallet);
                setTransactions(result.data.transactions || []);
            }
        } catch (error) {
            console.error('Error loading wallet:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!amount || parseFloat(amount) <= 0) return;

        setSubmitting(true);
        setMessage(null);

        try {
            const response = await fetch('/api/admin/users/wallet', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'x-user-id': userId
                },
                body: JSON.stringify({
                    action,
                    targetUserId: userId,
                    amount: parseFloat(amount),
                    reason
                })
            });

            const result = await response.json();

            if (result.success) {
                setMessage({ type: 'success', text: `${action === 'credit' ? 'Credited' : 'Debited'} ৳${amount} successfully` });
                setAmount('');
                setReason('');
                loadWalletData();
            } else {
                setMessage({ type: 'error', text: result.error || 'Operation failed' });
            }
        } catch (error: any) {
            setMessage({ type: 'error', text: error.message });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Wallet Balance Card */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">মোট ব্যালেন্স</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    ৳{(walletData?.balance || 0).toLocaleString('bn-BD')}
                                </p>
                            </div>
                            <Wallet className="w-8 h-8 text-emerald-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">লকড ব্যালেন্স</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    ৳{(walletData?.locked_balance || 0).toLocaleString('bn-BD')}
                                </p>
                            </div>
                            <Lock className="w-8 h-8 text-amber-400" />
                        </div>
                    </CardContent>
                </Card>

                <Card className="bg-slate-900 border-slate-800">
                    <CardContent className="p-5">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-xs text-slate-500">উপলব্ধ ব্যালেন্স</p>
                                <p className="text-2xl font-bold text-white mt-1">
                                    ৳{(walletData?.available_balance || 0).toLocaleString('bn-BD')}
                                </p>
                            </div>
                            <RefreshCw className="w-8 h-8 text-blue-400" />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Credit/Debit Form */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg">ওয়ালেট পরিচালনা</CardTitle>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div className="flex gap-2">
                            <Button
                                type="button"
                                variant={action === 'credit' ? 'default' : 'outline'}
                                onClick={() => setAction('credit')}
                                className={cn(
                                    "flex-1",
                                    action === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'border-slate-700'
                                )}
                            >
                                <Plus className="w-4 h-4 mr-1" />
                                ক্রেডিট
                            </Button>
                            <Button
                                type="button"
                                variant={action === 'debit' ? 'default' : 'outline'}
                                onClick={() => setAction('debit')}
                                className={cn(
                                    "flex-1",
                                    action === 'debit' ? 'bg-red-600 hover:bg-red-700' : 'border-slate-700'
                                )}
                            >
                                <Minus className="w-4 h-4 mr-1" />
                                ডেবিট
                            </Button>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <Label htmlFor="amount" className="text-slate-400">পরিমাণ (BDT)</Label>
                                <Input
                                    id="amount"
                                    type="number"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                    placeholder="0.00"
                                    min="0"
                                    step="0.01"
                                    className="bg-slate-800 border-slate-700 text-white"
                                    required
                                />
                            </div>
                            <div>
                                <Label htmlFor="reason" className="text-slate-400">কারণ (ঐচ্ছিক)</Label>
                                <Input
                                    id="reason"
                                    value={reason}
                                    onChange={(e) => setReason(e.target.value)}
                                    placeholder="e.g., Bonus, Refund"
                                    className="bg-slate-800 border-slate-700 text-white"
                                />
                            </div>
                        </div>

                        {message && (
                            <div className={cn(
                                "flex items-center gap-2 p-3 rounded-lg",
                                message.type === 'success' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'
                            )}>
                                {message.type === 'success' ? (
                                    <CheckCircle className="w-4 h-4" />
                                ) : (
                                    <AlertCircle className="w-4 h-4" />
                                )}
                                {message.text}
                            </div>
                        )}

                        <Button
                            type="submit"
                            disabled={submitting || !amount}
                            className={cn(
                                "w-full",
                                action === 'credit' ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-red-600 hover:bg-red-700'
                            )}
                        >
                            {submitting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    প্রসেসিং...
                                </>
                            ) : (
                                <>
                                    {action === 'credit' ? 'ক্রেডিট করুন' : 'ডেবিট করুন'}
                                </>
                            )}
                        </Button>
                    </form>
                </CardContent>
            </Card>

            {/* Transaction History */}
            <Card className="bg-slate-900 border-slate-800">
                <CardHeader>
                    <CardTitle className="text-white text-lg flex items-center gap-2">
                        <History className="w-5 h-5" />
                        ট্রানজাকশন ইতিহাস
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    {transactions.length > 0 ? (
                        <Table>
                            <TableHeader>
                                <TableRow className="border-slate-800 hover:bg-transparent">
                                    <TableHead className="text-slate-400">তারিখ</TableHead>
                                    <TableHead className="text-slate-400">টাইপ</TableHead>
                                    <TableHead className="text-slate-400">পরিমাণ</TableHead>
                                    <TableHead className="text-slate-400">স্ট্যাটাস</TableHead>
                                    <TableHead className="text-slate-400">বিবরণ</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {transactions.map((tx) => (
                                    <TableRow key={tx.id} className="border-slate-800">
                                        <TableCell className="text-slate-300">
                                            {new Date(tx.created_at).toLocaleDateString('bn-BD')}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className={cn(
                                                "capitalize",
                                                tx.transaction_type.includes('credit') ? 'bg-emerald-500/20 text-emerald-400' :
                                                    tx.transaction_type.includes('debit') ? 'bg-red-500/20 text-red-400' :
                                                        'bg-blue-500/20 text-blue-400'
                                            )}>
                                                {tx.transaction_type}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className={cn(
                                            "font-medium",
                                            tx.transaction_type.includes('credit') ? 'text-emerald-400' : 'text-red-400'
                                        )}>
                                            {tx.transaction_type.includes('credit') ? '+' : '-'}৳{tx.amount.toLocaleString()}
                                        </TableCell>
                                        <TableCell>
                                            <Badge className="bg-emerald-500/20 text-emerald-400">
                                                {tx.status}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-slate-400">
                                            {tx.description || '-'}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    ) : (
                        <div className="text-center py-8 text-slate-500">
                            কোনো ট্রানজাকশন পাওয়া যায়নি
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}

// Lock icon component
function Lock({ className }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
        >
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
            <path d="M7 11V7a5 5 0 0 1 10 0v4" />
        </svg>
    );
}
