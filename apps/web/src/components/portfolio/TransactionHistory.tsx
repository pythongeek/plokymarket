'use client';

import { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    ArrowUpRight,
    ArrowDownLeft,
    Search,
    Filter,
    Download,
    Wallet,
    ShoppingBag,
    History,
    AlertCircle
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { formatCurrency, formatDate } from '@/lib/format';
import { useTranslation } from 'react-i18next';

interface Transaction {
    id: string;
    type: 'deposit' | 'withdrawal' | 'trade_buy' | 'trade_sell' | 'fee' | 'adjustment';
    amount: number;
    currency: 'USD' | 'BDT';
    status: 'completed' | 'pending' | 'failed';
    timestamp: string;
    description: string;
    txHash?: string;
}

interface TransactionHistoryProps {
    userId?: string;
}

export function TransactionHistory({ userId }: TransactionHistoryProps) {
    const { t } = useTranslation();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterType, setFilterType] = useState<string>('all');

    // Mock data for initial implementation
    const transactions: Transaction[] = useMemo(() => [
        {
            id: 'tx_1',
            type: 'deposit',
            amount: 5000,
            currency: 'BDT',
            status: 'completed',
            timestamp: new Date().toISOString(),
            description: 'bKash Deposit',
            txHash: 'BK4829302'
        },
        {
            id: 'tx_2',
            type: 'trade_buy',
            amount: -1200,
            currency: 'BDT',
            status: 'completed',
            timestamp: new Date(Date.now() - 3600000).toISOString(),
            description: 'Bought YES - World Cup Finals',
        },
        {
            id: 'tx_3',
            type: 'fee',
            amount: -24,
            currency: 'BDT',
            status: 'completed',
            timestamp: new Date(Date.now() - 3601000).toISOString(),
            description: 'Platform Fee (2%)',
        },
        {
            id: 'tx_4',
            type: 'withdrawal',
            amount: -2000,
            currency: 'BDT',
            status: 'pending',
            timestamp: new Date(Date.now() - 86400000).toISOString(),
            description: 'Nagad Withdrawal',
        }
    ], []);

    const filteredTransactions = transactions.filter(tx => {
        const matchesSearch = tx.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
            tx.id.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesType = filterType === 'all' || tx.type === filterType;
        return matchesSearch && matchesType;
    });

    return (
        <Card className="border-primary/10">
            <CardHeader>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <CardTitle className="text-lg flex items-center gap-2">
                        <History className="w-5 h-5 text-primary" />
                        {t('portfolio.transaction_history', 'Transaction History')}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="সাদা বা আইডি দিয়ে খুঁজুন..."
                                className="pl-8"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Button variant="outline" size="icon">
                            <Filter className="h-4 w-4" />
                        </Button>
                        <Button variant="outline" size="icon">
                            <Download className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            </CardHeader>
            <CardContent>
                {filteredTransactions.length === 0 ? (
                    <div className="py-20 text-center space-y-4">
                        <div className="flex justify-center">
                            <AlertCircle className="h-12 w-12 text-muted-foreground/30" />
                        </div>
                        <p className="text-muted-foreground">কোনো লেনদেন পাওয়া যায়নি।</p>
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="border-b text-muted-foreground font-medium">
                                    <th className="text-left py-3 px-4">টাইপ</th>
                                    <th className="text-left py-3 px-4">বিস্তারিত</th>
                                    <th className="text-right py-3 px-4">পরিমাণ</th>
                                    <th className="text-center py-3 px-4">স্ট্যাটাস</th>
                                    <th className="text-right py-3 px-4">তারিখ</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredTransactions.map((tx) => {
                                    const isPositive = tx.amount > 0;
                                    const Icon = tx.type.includes('trade') ? ShoppingBag : Wallet;

                                    return (
                                        <tr key={tx.id} className="hover:bg-muted/30 transition-colors">
                                            <td className="py-4 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className={cn(
                                                        "p-2 rounded-full",
                                                        isPositive ? "bg-emerald-100 text-emerald-600" : "bg-muted text-muted-foreground"
                                                    )}>
                                                        {isPositive ? <ArrowDownLeft className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                                                    </div>
                                                    <span className="font-medium capitalize">{tx.type.replace('_', ' ')}</span>
                                                </div>
                                            </td>
                                            <td className="py-4 px-4">
                                                <p className="font-medium">{tx.description}</p>
                                                {tx.txHash && <p className="text-[10px] text-muted-foreground font-mono">{tx.txHash}</p>}
                                            </td>
                                            <td className={cn(
                                                "py-4 px-4 text-right font-bold",
                                                isPositive ? "text-emerald-600" : "text-foreground"
                                            )}>
                                                {isPositive ? '+' : ''}{formatCurrency(tx.amount, tx.currency)}
                                            </td>
                                            <td className="py-4 px-4 text-center">
                                                <Badge
                                                    variant={tx.status === 'completed' ? 'default' : tx.status === 'failed' ? 'destructive' : 'secondary'}
                                                    className={cn(
                                                        "text-[10px] uppercase tracking-wider",
                                                        tx.status === 'completed' && "bg-emerald-500 hover:bg-emerald-600"
                                                    )}
                                                >
                                                    {tx.status}
                                                </Badge>
                                            </td>
                                            <td className="py-4 px-4 text-right text-muted-foreground">
                                                {formatDate(tx.timestamp)}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
